// backend/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            console.error('❌ MONGODB_URI not configured in .env file');
            console.log('Please update .env with your MongoDB Atlas connection string');
            process.exit(1);
        }

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Connected to: ${mongoUri.split('@')[1]}`);
        
        // Create indexes for better performance
        try {
            await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
            await mongoose.connection.collection('medications').createIndex({ user: 1 });
            await mongoose.connection.collection('medications').createIndex({ nextReminder: 1 });
            console.log('✅ Database indexes created');
        } catch (indexError) {
            console.warn('⚠️  Index creation warning:', indexError.message);
        }
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('\n📌 To fix this:');
        console.log('1. Go to https://cloud.mongodb.com');
        console.log('2. Create a free MongoDB Atlas account');
        console.log('3. Get your connection string');
        console.log('4. Update MONGODB_URI in .env file');
        console.log('\nRetrying in 10 seconds...\n');
        
        setTimeout(() => {
            connectDB();
        }, 10000);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('📊 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from DB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;