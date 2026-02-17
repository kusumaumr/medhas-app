const mongoose = require('mongoose');
require('dotenv').config();
const Medication = require('./models/medication');
const User = require('./models/user');

async function testReminder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        console.log('✅ Connected to MongoDB');

        // Find the user
        const user = await User.findOne({ email: 'kusumaumr@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        // Set user language to Telugu to be sure
        user.language = 'te';
        await user.save();
        console.log('✅ User language set to Telugu');

        // Create a medication scheduled for 1 minute from now
        const now = new Date();
        const nextTime = new Date(now.getTime() + 65000); // 65 seconds from now to be safe

        // Delete existing test med if any
        await Medication.deleteMany({ name: 'Verification-Test' });

        const med = new Medication({
            user: user._id,
            name: 'Verification-Test',
            dosage: '500mg',
            schedule: {
                frequency: 'Daily',
                times: [nextTime.getHours() * 60 + nextTime.getMinutes()],
                startDate: now
            },
            reminders: {
                enabled: true,
                methods: ['voice', 'sms', 'email']
            },
            nextReminder: nextTime,
            status: 'active'
        });

        await med.save();
        console.log(`✅ Test medication 'Verification-Test' created for ${nextTime.toLocaleTimeString()}`);
        console.log(`📞 A voice call should trigger in about 1 minute at ${nextTime.toLocaleTimeString()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testReminder();
