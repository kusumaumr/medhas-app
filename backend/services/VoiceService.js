const twilio = require('twilio');

class VoiceService {
    constructor() {
        this.client = null;
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        this.initialize();
    }

    initialize() {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            try {
                this.client = twilio(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );
                console.log('✅ VoiceService (Twilio) initialized');
            } catch (error) {
                console.error('❌ VoiceService initialization failed:', error.message);
            }
        } else {
            console.warn('⚠️  VoiceService skipped: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing');
        }
    }

    /**
     * Make a voice call with a text-to-speech message
     * @param {string} to - The phone number to call
     * @param {string} message - The message to speak
     * @param {string} language - The language code (en, te, hi, etc.)
     */
    async makeCall(to, message, language = 'en') {
        if (!this.client) {
            console.warn('⚠️  Cannot make call: VoiceService not initialized');
            return false;
        }

        if (!to) {
            console.warn('⚠️  Cannot make call: No phone number provided');
            return false;
        }

        try {
            console.log(`📞 Initiating call to ${to} in language: ${language}...`);

            // Map language codes to Twilio TTS language codes and localized phrases
            const langMap = {
                'en': {
                    code: 'en-US',
                    voice: 'Polly.Joanna',
                    greeting: 'Hello. This is a reminder from iMedhas.',
                    repeat: 'I repeat.',
                    goodbye: 'Goodbye.'
                },
                'te': {
                    code: 'te-IN',
                    // Using Google Telugu Standard A voice for better pronunciation
                    voice: 'Google.te-IN-Standard-A',
                    greeting: 'నమస్కారం, ఇది మీ ఐ-మేధాస్ మందుల రిమైండర్.',
                    repeat: 'నేను మళ్ళీ చెబుతున్నాను.',
                    goodbye: 'ధన్యవాదాలు, మీ ఆరోగ్యం జాగ్రత్త.',
                    timeToTake: 'ఇప్పుడు మీరు ఈ మందులు వేసుకోవాలి:',
                    instructions: 'సూచనలు:'
                },
                'hi': {
                    code: 'hi-IN',
                    // voice removed for consistency and reliability
                    greeting: 'नमस्ते। यह iMedhas से आपका दवा रिमाइंडर है।',
                    repeat: 'मैं दोहराता हूँ।',
                    goodbye: 'धन्यवाद।'
                }
            };

            const langConfig = langMap[language] || langMap['en'];
            const voiceAttr = langConfig.voice ? ` voice="${langConfig.voice}"` : '';
            console.log(`📡 Using language config for: ${language}`, langConfig);

            // TwiML (Twilio Markup Language) for Text-to-Speech
            // XML must not have leading whitespace for some parsers
            const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say${voiceAttr} language="${langConfig.code}">
        ${langConfig.greeting}
        ${message}
    </Say>
    <Pause length="1"/>
    <Say${voiceAttr} language="${langConfig.code}">
        ${langConfig.repeat}
        ${message}
    </Say>
    <Pause length="1"/>
    <Say${voiceAttr} language="${langConfig.code}">
        ${langConfig.goodbye}
    </Say>
</Response>`;

            console.log('📝 Generated TwiML (full):', twiml);

            const call = await this.client.calls.create({
                twiml: twiml,
                to: to,
                from: this.phoneNumber
            });

            console.log(`✅ Call initiated successfully. SID: ${call.sid}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to make voice call:', error.message);
            return false;
        }
    }
}

module.exports = new VoiceService();
