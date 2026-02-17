const mongoose = require('mongoose');
require('dotenv').config();
const VoiceService = require('./services/VoiceService');
const User = require('./models/user');

async function triggerCall() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: 'kusumaumr@gmail.com' });
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        console.log(`📞 Triggering call to ${user.phone} in ${user.language}...`);
        
        const message = "నమస్కారం! ఇది మీ మందుల రిమైండర్. దయచేసి మీ మెట్‌ఫార్మిన్ 500 ఎంజి వేసుకోండి.";
        
        const success = await VoiceService.makeCall(user.phone, message, user.language || 'te');
        
        if (success) {
            console.log('✅ Call initiated successfully');
        } else {
            console.log('❌ Call initiation failed');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

triggerCall();
