const mongoose = require('mongoose');
const User = require('./models/user');

async function fixDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/medisafeDB');

        // Fix #1: Update phone number to E.164 format
        const userResult = await User.updateOne(
            { email: 'kusumaumr@gmail.com' },
            { $set: { phone: '+917842501571' } }
        );
        console.log(`✅ Phone number updated: ${userResult.modifiedCount} user(s)`);

        // Fix #2: Add SMS to reminders.methods for all medications
        const medResult = await mongoose.connection.db.collection('medications').updateMany(
            {},
            { $set: { 'reminders.methods': ['push', 'sms'] } }
        );
        console.log(`✅ SMS enabled for: ${medResult.modifiedCount} medication(s)`);

        // Verify the fixes
        const user = await User.findOne({ email: 'kusumaumr@gmail.com' }, 'phone');
        console.log(`\n📱 User phone: ${user.phone}`);

        const med = await mongoose.connection.db.collection('medications').findOne({ name: 'Test Aspirin' });
        console.log(`💊 Test Aspirin reminders.methods: ${JSON.stringify(med.reminders.methods)}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixDatabase();
