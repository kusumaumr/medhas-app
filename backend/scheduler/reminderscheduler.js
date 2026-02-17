const schedule = require('node-schedule');
const Medication = require('../models/medication');
const User = require('../models/user');
const VoiceService = require('../services/VoiceService');
const emailService = require('../services/emailService');
const twilio = require('twilio');
const admin = require('firebase-admin');

class ReminderScheduler {
    constructor() {
        this.jobs = new Map();
        this.initializeServices();
        this.start();
    }

    initializeServices() {
        // Initialize Twilio client
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_ACCOUNT_SID.trim() !== '' && process.env.TWILIO_AUTH_TOKEN.trim() !== '') {
            try {
                this.twilioClient = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
            } catch (error) {
                console.warn('⚠️  Twilio initialization failed:', error.message);
            }
        }

        // Initialize Firebase Admin
        if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
    }

    async start() {
        console.log('🚀 Starting Reminder Scheduler...');

        try {
            // Load all active medications
            const medications = await Medication.find({
                status: 'active',
                'reminders.enabled': true,
                nextReminder: { $gt: new Date() }
            }).populate('user', 'name email phone language notificationPreferences emergencyContacts');

            console.log(`📊 Loaded ${medications.length} active medications`);

            // Schedule jobs for each medication
            for (const medication of medications) {
                this.scheduleMedicationReminder(medication);
            }

            // Start periodic check for new medications
            this.startPeriodicCheck();

            console.log('✅ Reminder Scheduler started successfully');
        } catch (error) {
            console.error('❌ Error starting scheduler:', error);
        }
    }

    scheduleMedicationReminder(medication) {
        if (!medication.nextReminder || medication.nextReminder <= new Date()) {
            return;
        }

        const jobId = `med-${medication._id}-${medication.nextReminder.getTime()}`;

        // Cancel existing job for this medication
        if (this.jobs.has(jobId)) {
            this.jobs.get(jobId).cancel();
        }

        // Schedule new job
        const job = schedule.scheduleJob(medication.nextReminder, async () => {
            console.log(`⏰ Reminder triggered for ${medication.name}`);

            try {
                // Send reminders
                await this.sendReminder(medication);

                // Schedule next reminder
                await this.scheduleNextReminder(medication);
            } catch (error) {
                console.error('Error processing reminder:', error);
            }
        });

        this.jobs.set(jobId, job);
        console.log(`📅 Scheduled reminder for ${medication.name} at ${medication.nextReminder}`);
    }

    async sendReminder(medication) {
        // Re-fetch user to get latest language preference
        // The 'medication.user' might be stale from when the job was scheduled
        let user = medication.user;
        try {
            const freshUser = await User.findById(user._id);
            if (freshUser) {
                user = freshUser;
                console.log(`🔄 Refetched user: ${user.name}, Language: ${user.language}`);
            }
        } catch (err) {
            console.error('Error refetching user:', err);
        }

        const reminderMethods = medication.reminders.methods || ['push'];

        // Prepare reminder message
        const message = this.createReminderMessage(medication, user);
        console.log(`📡 Attempting to send reminders via: ${reminderMethods.join(', ')}`);

        // Send through all enabled methods
        for (const method of reminderMethods) {
            console.log(`🔍 Processing method: ${method}`);
            try {
                switch (method) {
                    case 'push':
                        await this.sendPushNotification(user, message);
                        break;
                    case 'sms':
                        await this.sendSMS(user, message);
                        break;
                    case 'email':
                        await this.sendEmail(user, message);
                        break;
                    case 'voice':
                        // Force Telugu for voice calls as per requirement
                        // "Voice call anedi... voice call matram naku telugu lone kavali"
                        const teluguMessage = this.getTeluguMessage(medication);
                        console.log(`🗣️ Initiating Voice Call in Telugu to ${user.phone}`);
                        await VoiceService.makeCall(user.phone, `${teluguMessage.body}. ${teluguMessage.instructions}`, 'te');
                        break;
                }
                console.log(`✅ ${method.toUpperCase()} reminder sent successfully for ${medication.name}`);
            } catch (error) {
                console.error(`❌ Error sending ${method} reminder for ${medication.name}:`, error);
            }
        }

        // Send to emergency contacts if configured
        if (medication.reminders.notifyEmergencyContacts) {
            await this.notifyEmergencyContacts(user, medication, message);
        }
    }

    createReminderMessage(medication, user) {
        const time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Telugu translation helper (simple version)
        console.log(`Debug Reminder: User language is '${user.language}'`);
        const isTelugu = user.language === 'te';

        let title = `💊 Time to take ${medication.name}`;
        let body = `Take ${medication.dosage.value} ${medication.dosage.unit} of ${medication.name}`;
        let instructions = medication.instructions.specialInstructions || 'Take as prescribed';

        if (isTelugu) {
            title = `💊 ${medication.name} వేసుకునే సమయం`;
            // "Paracetamol 500 mg Tablet ivvandi" -> "Paracetamol 500 mg Tablet vesukondi"
            body = `${medication.name} - ${medication.dosage.value} ${medication.dosage.unit} వేసుకోండి`;

            // Simple mapping for common instructions
            const instrLower = instructions.toLowerCase();
            if (instrLower.includes('after food')) instructions = 'భోజనం తర్వాత వేసుకోండి';
            else if (instrLower.includes('before food')) instructions = 'భోజనం ముందు వేసుకోండి';
            else if (instrLower.includes('with food')) instructions = 'భోజనంతో పాటు వేసుకోండి';
            else instructions = `${instructions} (వేసుకోండి)`;
        }

        return {
            title: title,
            body: body,
            instructions: instructions,
            time: time,
            medicationId: medication._id.toString(),
            userId: user._id.toString(),
            type: 'medication_reminder',
            priority: 'high',
            data: {
                dosage: `${medication.dosage.value} ${medication.dosage.unit}`,
                form: medication.dosage.form,
                withFood: medication.instructions.takeWith,
                nextReminder: medication.nextReminder
            }
        };
    }

    getTeluguMessage(medication) {
        let body = `${medication.name} - ${medication.dosage.value} ${medication.dosage.unit} వేసుకోండి`;
        let instructions = medication.instructions.specialInstructions || 'Take as prescribed';

        // Simple mapping for common instructions
        const instrLower = instructions.toLowerCase();
        if (instrLower.includes('after food')) instructions = 'భోజనం తర్వాత వేసుకోండి';
        else if (instrLower.includes('before food')) instructions = 'భోజనం ముందు వేసుకోండి';
        else if (instrLower.includes('with food')) instructions = 'భోజనంతో పాటు వేసుకోండి';
        else instructions = `${instructions} (వేసుకోండి)`;

        return {
            title: `💊 ${medication.name} వేసుకునే సమయం`,
            body: body,
            instructions: instructions
        };
    }

    async sendPushNotification(user, message) {
        if (!admin.apps.length) return;

        try {
            // Get user's device tokens (you would store these in the database)
            const deviceTokens = await this.getUserDeviceTokens(user._id);

            if (deviceTokens.length === 0) return;

            const payload = {
                notification: {
                    title: message.title,
                    body: message.body,
                    sound: 'default'
                },
                data: message.data,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        priority: 'high',
                        vibrateTimingsMillis: [0, 500, 500, 500]
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                tokens: deviceTokens
            };

            await admin.messaging().sendEachForMulticast(payload);
        } catch (error) {
            console.error('Push notification error:', error);
        }
    }

    async sendSMS(user, message) {
        if (!this.twilioClient || !user.phone) return;

        try {
            await this.twilioClient.messages.create({
                body: `${message.title}\n${message.body}\n${message.instructions}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phone
            });
        } catch (error) {
            console.error('SMS sending error:', error);
        }
    }

    async sendEmail(user, message) {
        if (!user.email) {
            console.warn('⚠️  Cannot send email - user has no email address');
            return;
        }

        try {
            console.log(`📧 Sending email to: ${user.email}`);
            await emailService.sendEmail(user.email, message.title, `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${message.title}</h2>
                    <p style="font-size: 16px;">${message.body}</p>
                    <p style="font-size: 14px; color: #666;">${message.instructions}</p>
                    <p style="font-size: 12px; color: #999;">Time: ${message.time}</p>
                    <hr>
                    <p style="font-size: 12px; color: #999;">
                        This is an automated reminder from MediSafe.
                    </p>
                </div>
            `);
        } catch (error) {
            console.error('❌ Email sending error:', error.message);
        }
    }

    async notifyEmergencyContacts(user, medication, message) {
        if (!user.emergencyContacts || user.emergencyContacts.length === 0) return;

        for (const contact of user.emergencyContacts.slice(0, 3)) { // Limit to 3 contacts
            try {
                const alertMessage = `🚨 MediSafe Alert: ${user.name} may have missed their ${medication.name} medication.`;

                if (contact.phone && this.twilioClient) {
                    await this.twilioClient.messages.create({
                        body: alertMessage,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: contact.phone
                    });
                }
            } catch (error) {
                console.error('Error notifying emergency contact:', error);
            }
        }
    }

    async scheduleNextReminder(medication) {
        medication.updateNextReminder();
        await medication.save();

        if (medication.nextReminder) {
            this.scheduleMedicationReminder(medication);
        }
    }

    startPeriodicCheck() {
        // Check for new medications every minute
        schedule.scheduleJob('*/1 * * * *', async () => {
            try {
                const newMedications = await Medication.find({
                    status: 'active',
                    'reminders.enabled': true,
                    nextReminder: { $gt: new Date() },
                    _id: {
                        $nin: Array.from(this.jobs.keys())
                            .map(id => id.split('-')[1])
                            .filter(id => id)
                    }
                }).populate('user', 'name email phone language notificationPreferences emergencyContacts');

                for (const medication of newMedications) {
                    this.scheduleMedicationReminder(medication);
                }
            } catch (error) {
                console.error('Periodic check error:', error);
            }
        });

        // Clean up old jobs daily
        schedule.scheduleJob('0 0 * * *', () => {
            this.cleanupOldJobs();
        });
    }

    cleanupOldJobs() {
        const now = Date.now();
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.nextInvocation() < now) {
                job.cancel();
                this.jobs.delete(jobId);
            }
        }
    }

    async getUserDeviceTokens(userId) {
        // Implement this based on your token storage
        return [];
    }

    stop() {
        for (const [jobId, job] of this.jobs.entries()) {
            job.cancel();
        }
        this.jobs.clear();
        console.log('🛑 Reminder Scheduler stopped');
    }
}

module.exports = new ReminderScheduler();