require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
    console.log('Testing Email Service...');
    console.log('User:', process.env.EMAIL_USER);
    // Don't log the full password
    console.log('Password set:', !!process.env.EMAIL_PASSWORD);

    try {
        const success = await emailService.sendEmail(
            process.env.EMAIL_USER, // Send to self
            'Test Email from MediSafe',
            '<h1>It works!</h1><p>This is a test email.</p>'
        );

        if (success) {
            console.log('✅ Test email sent successfully!');
        } else {
            console.error('❌ Failed to send test email.');
        }
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testEmail();
