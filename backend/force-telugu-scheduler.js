const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB first
async function runScheduler() {
    try {
        console.log('🔌 Connecting to MongoDB (Standalone)...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisafeDB');
        console.log('✅ Connected to MongoDB');

        console.log('🚀 Starting Standalone Scheduler with TELUGU Support...');

        // Requiring the scheduler should trigger its constructor and start() method
        // verified in reminderscheduler.js: class constructor calls this.start()
        const scheduler = require('./scheduler/reminderscheduler');

        // Keep the process alive
        console.log('⏳ Scheduler running. Waiting for reminders...');

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down standalone scheduler...');
            await mongoose.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error starting standalone scheduler:', error);
        process.exit(1);
    }
}

runScheduler();
