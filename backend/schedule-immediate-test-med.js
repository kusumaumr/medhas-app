const mongoose = require('mongoose');
require('dotenv').config();
const Medication = require('./models/medication');
const User = require('./models/user');

async function scheduleImmediateTest() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');

        const userEmail = 'kusumaumr@gmail.com';
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error(`❌ User ${userEmail} not found`);
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name}`);

        // Schedule for 2 minutes from now to give enough time to pick up
        const reminderTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        console.log(`🕒 Scheduling reminder for: ${reminderTime.toLocaleTimeString()}`);

        const testMed = new Medication({
            name: "Test Telugu Call",
            dosage: "1 Tablet",
            instructions: { specialInstructions: "Take with water", takeWith: "with-food" },
            frequency: "daily",
            times: [reminderTime.toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)], // HH:MM
            startDate: new Date(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            user: user._id,
            nextReminder: reminderTime,
            status: 'active',
            reminders: {
                enabled: true,
                methods: ['voice'] // Force voice
            }
        });

        await testMed.save();
        console.log('✅ Test medication created successfully!');
        console.log(`🆔 ID: ${testMed._id}`);
        console.log('⏳ The standalone scheduler should pick this up in ~1 minute.');
        console.log('📞 Please wait for the call.');

        setTimeout(() => process.exit(0), 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

scheduleImmediateTest();
