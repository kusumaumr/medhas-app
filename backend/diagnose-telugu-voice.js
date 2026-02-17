const mongoose = require('mongoose');
require('dotenv').config();
const VoiceService = require('./services/VoiceService');
const User = require('./models/user');
// We need to access the logic inside ReminderScheduler, but it's a class instance.
// We can manually replicate the createReminderMessage logic here to test it.

async function diagnoseTeluguVoice() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');

        const userEmail = 'kusumaumr@gmail.com';
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error(`❌ User ${userEmail} not found`);
            process.exit(1);
        }

        console.log(`👤 User: ${user.name}, Language: '${user.language}'`);

        // REPLICATING Logic from ReminderScheduler.js
        const medication = {
            name: "Paracetamol",
            dosage: { value: "500", unit: "mg", form: "Tablet" },
            instructions: { specialInstructions: "Take after food", takeWith: "Food" },
            nextReminder: new Date()
        };

        console.log('--- Simulating createReminderMessage ---');
        console.log(`Debug Reminder: User language is '${user.language}'`);

        const isTelugu = user.language === 'te';
        console.log(`isTelugu check result: ${isTelugu}`);

        let title = `💊 Time to take ${medication.name}`;
        let body = `Take ${medication.dosage.value} ${medication.dosage.unit} of ${medication.name}`;
        let instructions = medication.instructions.specialInstructions || 'Take as prescribed';

        if (isTelugu) {
            console.log('🔤 Applying Telugu translation...');
            title = `💊 ${medication.name} వేసుకునే సమయం`;
            body = `${medication.name} - ${medication.dosage.value} ${medication.dosage.unit} వేసుకోండి`;

            const instrLower = instructions.toLowerCase();
            if (instrLower.includes('after food')) instructions = 'భోజనం తర్వాత వేసుకోండి';
            else if (instrLower.includes('before food')) instructions = 'భోజనం ముందు వేసుకోండి';
            else if (instrLower.includes('with food')) instructions = 'భోజనంతో పాటు వేసుకోండి';
            else instructions = `${instructions} (వేసుకోండి)`;
        } else {
            console.log('⚠️ Telugu translation SKIPPED.');
        }

        const fullMessage = `${body}. ${instructions}`;
        console.log(`📝 Generated Message: "${fullMessage}"`);

        console.log(`📞 Calling VoiceService.makeCall...`);
        // Actual Call
        const result = await VoiceService.makeCall(user.phone, fullMessage, user.language || 'en');

        console.log(`Call Result: ${result}`);

        setTimeout(() => process.exit(0), 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

diagnoseTeluguVoice();
