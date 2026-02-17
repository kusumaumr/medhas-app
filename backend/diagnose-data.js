const mongoose = require('mongoose');
require('dotenv').config();
const Medication = require('./models/medication');
const User = require('./models/user');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        const meds = await Medication.find({ name: 'Verification-Test' }).populate('user');

        if (meds.length === 0) {
            console.log(JSON.stringify({ error: 'No test medications found' }));
            process.exit(0);
        }

        const results = meds.map(med => ({
            id: med._id,
            name: med.name,
            methods: med.reminders.methods,
            nextReminder: med.nextReminder,
            user: med.user ? {
                email: med.user.email,
                phone: med.user.phone,
                language: med.user.language
            } : null
        }));

        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
        process.exit(1);
    }
}

diagnose();
