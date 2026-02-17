const socketIo = require('socket.io');

let io;

const initializeSocket = (server) => {
    // Initialize Socket.io with CORS enabled for frontend
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all origins for simplicity in development
            methods: ["GET", "POST"],
            allowedHeaders: ["my-custom-header"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);

        // Join a consultation room
        socket.on('join-room', (roomId, userId) => {
            console.log(`👤 User ${userId} joined room: ${roomId}`);
            socket.join(roomId);
            // Notify others in room
            socket.to(roomId).emit('user-connected', userId);
        });

        // WebRTC Signaling: Offer
        socket.on('offer', (data) => {
            // data: { roomId, offer }
            console.log(`📡 Offer received from ${socket.id} for room ${data.roomId}`);
            socket.to(data.roomId).emit('offer', data.offer);
        });

        // WebRTC Signaling: Answer
        socket.on('answer', (data) => {
            // data: { roomId, answer }
            console.log(`📡 Answer received from ${socket.id} for room ${data.roomId}`);
            socket.to(data.roomId).emit('answer', data.answer);
        });

        // WebRTC Signaling: ICE Candidate
        socket.on('ice-candidate', (data) => {
            // data: { roomId, candidate }
            console.log(`❄️ ICE Candidate received from ${socket.id} for room ${data.roomId}`);
            socket.to(data.roomId).emit('ice-candidate', data.candidate);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
            // Broadcast disconnect if needed
            // socket.broadcast.emit('user-disconnected', userId); // Implementation detail: we need to map socketId to userId
        });
    });

    console.log('✅ Socket.IO Service Initialized');
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initializeSocket, getIo };
