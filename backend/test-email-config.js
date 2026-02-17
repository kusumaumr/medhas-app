const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('🔍 Testing Email Configuration...');
    console.log(`👤 User: ${process.env.EMAIL_USER}`);

    const pass = process.env.EMAIL_PASSWORD || '';
    const isStandardPass = pass.length > 0 && !pass.includes(' ');

    console.log(`🔑 Password Length: ${pass.length} characters`);
    if (pass.length !== 16) {
        console.log('⚠️  WARNING: Google App Passwords are typically exactly 16 characters.');
    } else {
        console.log('✅ Format: Length looks correct (16 chars).');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        console.log('⏳ Attempting to connect to Gmail...');
        await transporter.verify();
        console.log('✅ SUCCESS: SMTP Connection Established!');
        console.log('✅ Your Google App Password is valid and working.');
        console.log('👉 You can now restart the server and use "Forgot Password".');
    } catch (error) {
        console.error('❌ FAILED: SMTP Connection Error');
        console.error(`Error Message: ${error.message}`);

        if (error.response) {
            console.error(`Server Response: ${error.response}`);
        }

        if (error.message.includes('535')) {
            console.log('\n--- TROUBLESHOOTING ---');
            console.log('1. You are likely using your Login Password instead of an App Password.');
            console.log('2. OR you have 2-Step Verification disabled (App Passwords require it).');
            console.log('3. Please check the "email-setup-guide.md" file for instructions.');
        }
    }
};

testEmail();
