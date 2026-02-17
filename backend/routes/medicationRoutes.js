const express = require('express');
const router = express.Router();
const Medication = require('../models/medication');
const { verifyToken: auth } = require('../middleware/authMiddleware');

// Get all medications for user
router.get('/', auth, async (req, res) => {
    try {
        const medications = await Medication.find({
            user: req.user._id,
            isActive: true, // Updated to match new schema
            isArchived: false
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: medications.length,
            data: medications
        });
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Add new medication
router.post('/', auth, async (req, res) => {
    try {
        // Add user ID to request body
        req.body.user = req.user._id;

        // Ensure reminders.methods is set (enable SMS by default)
        if (!req.body.reminders) {
            req.body.reminders = {};
        }
        if (!req.body.reminders.methods || req.body.reminders.methods.length === 0) {
            req.body.reminders.methods = ['push', 'sms', 'email', 'voice']; // Enable all notification types
        }

        // ---------------------------------------------------------
        // DRUG INTERACTION CHECK
        // ---------------------------------------------------------
        const InteractionService = require('../services/interactionService');

        // 1. Fetch user's existing active medications
        const existingMedications = await Medication.find({
            user: req.user._id,
            status: 'active',
            isArchived: false
        });

        // 2. Check for interactions
        const detectedInteractions = InteractionService.checkInteraction(
            req.body.name,
            existingMedications
        );

        // 3. If interactions found, check if we should proceed
        if (detectedInteractions.length > 0) {
            req.body.interactions = detectedInteractions;

            // If user hasn't explicitly ignored warnings, return them WITHOUT saving
            if (!req.body.ignoreWarnings) {
                console.log(`⚠️ Blocking save due to interactions for ${req.body.name}`);
                return res.json({
                    success: false,
                    confirmationRequired: true,
                    warning: {
                        title: 'Interaction Warning',
                        count: detectedInteractions.length,
                        details: detectedInteractions
                    }
                });
            }
            console.log(`⚠️ Interactions detected for ${req.body.name}, but user ignored warnings.`);
        }
        // ---------------------------------------------------------

        // Create medication
        const medication = new Medication(req.body);

        // Calculate next reminder
        medication.updateNextReminder();

        await medication.save();

        console.log(`✅ Medication added: ${medication.name}, Next reminder: ${medication.nextReminder}`);

        // Return standard response (warning is already handled if we got here)
        const responseData = {
            success: true,
            data: medication
        };

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error adding medication:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// Update medication
router.put('/:id', auth, async (req, res) => {
    try {
        let medication = await Medication.findById(req.params.id);

        if (!medication) {
            return res.status(404).json({ success: false, message: 'Medication not found' });
        }

        // Make sure user owns medication
        if (medication.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Update fields
        medication = await Medication.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Recalculate reminder if schedule changed
        if (req.body.schedule) {
            const medDoc = await Medication.findById(req.params.id);
            medDoc.updateNextReminder();
            await medDoc.save();
            medication = medDoc; // Return fully updated doc
        }

        res.json({
            success: true,
            data: medication
        });
    } catch (error) {
        console.error('Error updating medication:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Delete medication (archive)
router.delete('/:id', auth, async (req, res) => {
    try {
        const medication = await Medication.findById(req.params.id);

        if (!medication) {
            return res.status(404).json({ success: false, message: 'Medication not found' });
        }

        // Make sure user owns medication
        if (medication.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Soft delete (archive)
        medication.isArchived = true;
        medication.status = 'stopped';
        await medication.save();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting medication:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Test SMS endpoint - verify Twilio is working
router.post('/test-sms', auth, async (req, res) => {
    try {
        const twilio = require('twilio');

        // Check if Twilio is configured
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
            return res.status(400).json({
                success: false,
                message: 'Twilio is not configured. Please check environment variables.'
            });
        }

        // Check if user has a phone number
        if (!req.user.phone) {
            return res.status(400).json({
                success: false,
                message: 'No phone number found for your account.'
            });
        }

        // Initialize Twilio client
        const twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Send test SMS
        const message = await twilioClient.messages.create({
            body: `🧪 Test SMS from MediSafe!\n\nYour phone number (${req.user.phone}) is correctly configured for medication reminders.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: req.user.phone
        });

        console.log(`✅ Test SMS sent to ${req.user.phone}, SID: ${message.sid}`);

        res.json({
            success: true,
            message: 'Test SMS sent successfully!',
            details: {
                to: req.user.phone,
                from: process.env.TWILIO_PHONE_NUMBER,
                messageSid: message.sid,
                status: message.status
            }
        });
    } catch (error) {
        console.error('❌ Test SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test SMS',
            error: error.message,
            code: error.code
        });
    }
});

// Test Voice call endpoint
router.post('/test-voice', auth, async (req, res) => {
    try {
        const VoiceService = require('../services/VoiceService');

        // Check if user has a phone number
        if (!req.user.phone) {
            return res.status(400).json({
                success: false,
                message: 'No phone number found for your account.'
            });
        }

        console.log(`📞 Sending test voice call to ${req.user.phone}...`);

        const success = await VoiceService.makeCall(
            req.user.phone,
            "Hello! This is a test voice call from your MediSafe application. Your voice reminders are now active."
        );

        if (success) {
            res.json({
                success: true,
                message: 'Voice call initiated successfully!',
                to: req.user.phone
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to initiate voice call. Check server logs for details.'
            });
        }
    } catch (error) {
        console.error('❌ Test Voice error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test voice call',
            error: error.message
        });
    }
});

module.exports = router;