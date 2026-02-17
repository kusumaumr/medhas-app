const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const VoiceService = require('./services/VoiceService');

const testVoice = async () => {
    // You can hardcode a number here for testing
    const testPhone = process.env.TEST_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;

    console.log('📞 Testing Telugu Voice Call...');
    console.log('NOTE: This will call the number: ' + testPhone);

    if (!testPhone || testPhone === process.env.TWILIO_PHONE_NUMBER) {
        console.log('⚠️  WARNING: No target phone number specified.');
        console.log('   Please set TEST_PHONE_NUMBER in .env or hardcode it in this script to test.');
        return;
    }

    // Telugu message: "Hello, this is a reminder from MediSafe. It is time to take your medication."
    const message = "నమస్కారం, ఇది మెడిసేఫ్ నుండి మీ మందుల రిమైండర్. మీ మందులు తీసుకోవలసిన సమయం అయింది.";

    await VoiceService.makeCall(testPhone, message, 'te');
};

testVoice();
