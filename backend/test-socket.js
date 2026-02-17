const io = require('socket.io-client');

const socket = io('http://localhost:5000');

console.log('🔌 Connecting to Socket.io server...');

socket.on('connect', () => {
    console.log('✅ Connected to Socket.io server! ID:', socket.id);

    // Test joining a room
    socket.emit('join-room', 'test-room', 'test-user');
});

socket.on('user-connected', (userId) => {
    console.log(`👤 User connected event received: ${userId}`);
    console.log('✅ Signaling logic verified.');
    socket.disconnect();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
});

// Timeout
setTimeout(() => {
    console.log('⚠️ Test timed out (Server might not be running or socket.io not configured)');
    process.exit(1);
}, 5000);
