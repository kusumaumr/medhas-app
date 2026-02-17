const mongoose = require('mongoose');
require('dotenv').config();
const VoiceService = require('./services/VoiceService');
const User = require('./models/user');

async function testTeluguVoice() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        console.log('✅ Connected to MongoDB');

        // Find the user to test with
        const userEmail = 'kusumaumr@gmail.com';
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error(`❌ User ${userEmail} not found`);
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name} (${user.phone})`);

        // Simulating the message construction from ReminderScheduler for Telugu
        // This logic mimics what we added to reminderscheduler.js
        const medicationName = "Paracetamol";
        const dosageValue = "500";
        const dosageUnit = "mg";

        // Construct Telugu message manually to verify VoiceService can handle it
        const teluguBody = `${medicationName} - ${dosageValue} ${dosageUnit} వేసుకోండి`;
        const teluguInstructions = "భోజనం తర్వాత వేసుకోండి"; // Take after food

        const fullMessage = `${teluguBody}. ${teluguInstructions}`;

        console.log(`📞 Initiating Voice Call to ${user.phone}...`);
        console.log(`🗣️ Message: ${fullMessage}`);
        console.log(`🌐 Language: te (Telugu)`);

        const result = await VoiceService.makeCall(user.phone, fullMessage, 'te');

        if (result) {
            console.log('✅ Voice call initiated successfully!');
            console.log('👂 Please listen to your phone and verify the Telugu speech.');
        } else {
            console.error('❌ Failed to initiate voice call.');
        }

        // Wait a bit before exiting to allow logs to flush
        setTimeout(() => {
            console.log('👋 Done.');
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('❌ Error during test:', error);
        process.exit(1);
    }
}

testTeluguVoice();
