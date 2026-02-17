// test-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  
  // Check if .env is loaded
  console.log('📁 Environment file loaded:', process.env.MONGODB_URI ? 'Yes' : 'No');
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI is not set in .env file');
    console.log('📌 Please check your .env file in backend folder');
    return;
  }
  
  // Mask password for security
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri.replace(/:[^:@]+@/, ':***@');
  console.log('🔗 Connection String:', maskedUri);
  
  // Test connection
  try {
    console.log('🔄 Attempting to connect...');
    
    // Set connection options
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ SUCCESS: Connected to MongoDB!');
    
    // List databases to verify
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log('📊 Available databases:', databases.databases.map(db => db.name));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    
  } catch (error) {
    console.log('❌ FAILED to connect:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if your MongoDB Atlas cluster is running');
    console.log('2. Verify your username/password in the connection string');
    console.log('3. Check Network Access in MongoDB Atlas (allow your IP)');
    console.log('4. Make sure the database name exists');
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication issue detected!');
      console.log('Go to MongoDB Atlas → Database Access → Create/Edit user');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.log('\n🌐 Network issue detected!');
      console.log('Go to MongoDB Atlas → Network Access → Add IP Address → Add Current IP');
    }
  }
}

testConnection();