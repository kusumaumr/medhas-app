const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD &&
            process.env.EMAIL_USER.trim() !== '' && process.env.EMAIL_PASSWORD.trim() !== '') {
            try {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });

                this.transporter.verify((error, success) => {
                    if (error) {
                        console.error('❌ Email transporter verification failed:', error.message);
                        console.error('📧 Make sure EMAIL_USER and EMAIL_PASSWORD are correct in .env');
                        this.transporter = null;
                    } else {
                        console.log('✅ Email service initialized');
                    }
                });
            } catch (error) {
                console.error('❌ Failed to create email transporter:', error.message);
                this.transporter = null;
            }
        } else {
            console.warn('⚠️  Email not configured in .env');
        }
    }

    async sendEmail(to, subject, html) {
        if (!this.transporter) {
            console.warn('⚠️  Cannot send email - transporter not initialized');
            return false;
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: to,
                subject: subject,
                html: html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('❌ Email sending error:', error.message);
            return false;
        }
    }

    async sendPasswordResetOTP(to, otp) {
        const subject = 'Password Reset OTP - MediSafe';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">Password Reset Request</h2>
                <p>You requested to reset your password. Use the code below to proceed:</p>
                <h1 style="font-size: 32px; letter-spacing: 5px; color: #333; background: #f0f0f0; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
                <p>This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        `;
        return this.sendEmail(to, subject, html);
    }
}

module.exports = new EmailService();
