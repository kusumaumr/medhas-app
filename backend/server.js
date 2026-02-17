const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


require('dotenv').config();

const app = express();
const http = require('http');
// const server = http.createServer(app); // No longer needed if using app.listen directly, but fine to keep if we use server.listen.
// However, in the previous step I changed server.listen to app.listen in the connectDB function.
// So I should remove http and socket.io imports and variables.

const { initializeSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
const allowedOrigins = [
  'http://localhost:19006',
  'http://localhost:8081',
  'https://intelligent-medication.vercel.app',
  'https://imedhas.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP Server for Socket.io
const server = http.createServer(app);
// Initialize Socket.io
initializeSocket(server);



// Function to safely import routes
const importRoute = (routePath, routeName) => {
  try {
    return require(routePath);
  } catch (error) {
    console.log(`⚠️  ${routeName} route not found at ${routePath}`);
    console.error(`   Error details: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    // Create a mock router for testing
    const router = require('express').Router();
    router.get('/test', (req, res) => {
      res.json({
        success: true,
        message: `${routeName} test route - actual route file not found`
      });
    });
    return router;
  }
};

// Import routes with error handling
const authRoutes = importRoute('./routes/authRoutes', 'Auth');
const medicationRoutes = importRoute('./routes/medicationRoutes', 'Medication');

// Start Reminder Scheduler
try {
  require('./scheduler/reminderscheduler');
  console.log('✅ Scheduler module loaded');
} catch (error) {
  console.error('❌ Failed to load scheduler:', error.message);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);

// API root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Medhas API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      test: '/test',
      documentation: '/api-docs',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      medications: {
        getAll: 'GET /api/medications',
        create: 'POST /api/medications',
        update: 'PUT /api/medications/:id',
        delete: 'DELETE /api/medications/:id'
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    env: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// API documentation
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'MediSafe API',
    version: '1.0.0',
    description: 'Medication Management API',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register new user',
        body: {
          name: 'string',
          email: 'string',
          password: 'string',
          phone: 'string'
        }
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login user',
        body: {
          email: 'string',
          password: 'string'
        }
      },
      {
        method: 'GET',
        path: '/api/medications',
        description: 'Get all medications (requires token)'
      }
    ]
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    time: new Date().toISOString(),
    baseUrl: process.env.NODE_ENV === 'production' ? process.env.BACKEND_URL : `http://localhost:${PORT}`,
    routes: {
      auth: '/api/auth',
      medications: '/api/medications',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
// Connect to MongoDB (Non-blocking)
// In production (Render), process.env.MONGODB_URI should be set if DB is needed.
// Locally, use localhost.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medhas_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('⚠️ MongoDB Connection Failed (App continues without DB):', err.message));

// Start Service
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(false, () => {
    console.log('\n🛑 Server shutting down gracefully...');
    process.exit(0);
  });
});