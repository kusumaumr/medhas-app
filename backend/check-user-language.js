const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');

async function checkUserLanguage() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');

        const userEmail = 'kusumaumr@gmail.com';
        console.log(`🔍 Looking up user: ${userEmail}`);

        const user = await User.findOne({ email: userEmail });

        if (user) {
            console.log('✅ User Found:');
            console.log(`   Name: ${user.name}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Language: '${user.language}'`); // Crucial check

            if (user.language !== 'te') {
                console.warn('⚠️  User language is NOT set to Telugu (te)!');
                console.log('   This is why the voice call is in English.');
            } else {
                console.log('✅ User language is correctly set to Telugu (te).');
            }
        } else {
            console.error('❌ User not found.');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUserLanguage();
