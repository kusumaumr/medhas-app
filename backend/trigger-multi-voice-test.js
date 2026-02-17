const mongoose = require('mongoose');
require('dotenv').config();
const twilio = require('twilio');
const User = require('./models/user');

async function multiVoiceTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: 'kusumaumr@gmail.com' });
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const from = process.env.TWILIO_PHONE_NUMBER;
        const to = user.phone;

        console.log(`📞 Triggering Multi-Voice Test Call to ${to}...`);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Test 1: Google Standard A -->
    <Say voice="Google.te-IN-Standard-A" language="te-IN">
        టెస్ట్ వన్. ఇది గూగుల్ స్టాండర్డ్ ఏ వాయిస్.
    </Say>
    <Pause length="1"/>
    
    <!-- Test 2: Polly Neural (Vani) -->
    <Say voice="Polly.Vani" language="te-IN">
        టెస్ట్ టూ. ఇది అమెజాన్ పాలీ వాణి వాయిస్.
    </Say>
    <Pause length="1"/>
    
    <!-- Test 3: Standard Say (Twilio Default) -->
    <Say language="te-IN">
        టెస్ట్ త్రీ. ఇది ట్విలియో డీఫాల్ట్ వాయిస్.
    </Say>
    <Pause length="1"/>
    
    <!-- Test 4: Alice -->
    <Say voice="alice" language="te-IN">
        టెస్ట్ ఫోర్. ఇది ఆలిస్ వాయిస్.
    </Say>
    <Pause length="1"/>
    
    <Say language="te-IN">దన్యవాదాలు.</Say>
</Response>`;

        const call = await client.calls.create({
            twiml: twiml,
            to: to,
            from: from
        });

        console.log(`✅ Multi-voice call initiated! SID: ${call.sid}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

multiVoiceTest();
