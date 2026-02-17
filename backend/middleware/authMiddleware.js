const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = {
    // Verify JWT token
    verifyToken: async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.',
                    code: 'NO_TOKEN'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024');
            
            const user = await User.findOne({ 
                _id: decoded.userId,
                isActive: true 
            }).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive',
                    code: 'USER_NOT_FOUND'
                });
            }

            req.user = user;
            req.token = token;
            next();
        } catch (error) {
            console.error('Token verification error:', error.message);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Server error during authentication',
                code: 'AUTH_ERROR'
            });
        }
    },

    // Check user role (if implementing roles)
    requireRole: (roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        };
    },

    // Check if user owns the resource
    checkOwnership: (modelName) => {
        return async (req, res, next) => {
            try {
                const Model = require(`../models/${modelName}`);
                const resource = await Model.findById(req.params.id);

                if (!resource) {
                    return res.status(404).json({
                        success: false,
                        message: 'Resource not found'
                    });
                }

                // Check if user owns the resource or is admin
                if (resource.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to access this resource'
                    });
                }

                req.resource = resource;
                next();
            } catch (error) {
                console.error('Ownership check error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server error'
                });
            }
        };
    },

    // Rate limiting middleware
    rateLimit: (options = {}) => {
        const limit = options.limit || 100;
        const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
        const store = new Map();

        return (req, res, next) => {
            const key = req.ip;
            const now = Date.now();
            
            if (!store.has(key)) {
                store.set(key, {
                    count: 1,
                    resetTime: now + windowMs
                });
                return next();
            }

            const record = store.get(key);
            
            if (now > record.resetTime) {
                record.count = 1;
                record.resetTime = now + windowMs;
                return next();
            }

            if (record.count >= limit) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000)
                });
            }

            record.count++;
            next();
        };
    },

    // Validate request body
    validate: (schema) => {
        return (req, res, next) => {
            const { error } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const errors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors
                });
            }

            next();
        };
    },

    // Log requests
    requestLogger: (req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
        next();
    },

    // Error handler middleware
    errorHandler: (err, req, res, next) => {
        console.error('Error:', err.stack);

        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';

        res.status(statusCode).json({
            success: false,
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
};

module.exports = authMiddleware;
