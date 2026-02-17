
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('test-output.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};
console.error = function (d) { //
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
}

const mongoose = require('mongoose');
const ReminderScheduler = require('./scheduler/reminderscheduler');
const VoiceService = require('./services/VoiceService');

// Mock VoiceService.makeCall
VoiceService.makeCall = async (to, message, language) => {
    console.log('--- MOCK VOICE CALL CALL ---');
    console.log(`To: ${to}`);
    console.log(`Language: ${language}`);
    console.log(`Message: ${message}`);
    console.log('----------------------------');

    if (language !== 'te') {
        console.error('❌ FAILURE: Language is not Telugu!');
    } else {
        console.log('✅ SUCCESS: Language is Telugu!');
    }

    if (!message.includes('వేసుకోండి')) {
        console.warn('⚠️ WARNING: Message might not contain Telugu text.');
    } else {
        console.log('✅ SUCCESS: Message contains Telugu text.');
    }
    return true;
};

async function testForcedTelugu() {
    console.log('🧪 Testing Forced Telugu Voice Call...');

    // Mock User (English preference)
    const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User',
        phone: '+919876543210',
        language: 'en', // User prefers English
        email: 'test@example.com'
    };

    // Mock Medication
    const mockMedication = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Dolo 650',
        dosage: { value: '1', unit: 'Tablet', form: 'Tablet' },
        instructions: { specialInstructions: 'After food', takeWith: 'Water' },
        reminders: { methods: ['voice'], notifyEmergencyContacts: false },
        user: mockUser,
        nextReminder: new Date(),
        save: async () => { }, // Mock save
        updateNextReminder: () => { } // Mock update
    };

    // We need to overwrite the User.findById to return our mock user
    // because sendReminder refetches the user
    // Monkey patch the User model requires inside reminderscheduler.js? No, it's already required.
    // We can monkey patch mongoose.model('User') if needed, but since User is imported, we can mock findById on the require cache if we access it correctly.

    // Attempt 1: Mock User.findById on the exported model
    // But ReminderScheduler imports User from '../models/user'
    // My test script imports User from './models/user' (same file)
    // require cache should return the same object.
    const User = require('./models/user');
    User.findById = async () => mockUser;

    // Also mock Medication.find used in start() to prevent errors/hangs
    const Medication = require('./models/medication');
    Medication.find = async () => [];

    try {
        await ReminderScheduler.sendReminder(mockMedication);
        console.log('🏁 Test completed.');
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }

    // Force exit to kill any lingering handles
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

testForcedTelugu();
