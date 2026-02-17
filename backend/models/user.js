const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']
    },
    allergies: [{
        type: String,
        trim: true
    }],
    medicalConditions: [{
        name: String,
        diagnosedDate: Date,
        status: {
            type: String,
            enum: ['active', 'in-remission', 'resolved']
        }
    }],
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'hi', 'te', 'es', 'fr', 'de', 'zh', 'ar']
    },
    notificationPreferences: {
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        reminderTime: { type: String, default: '30' } // minutes before
    },
    emergencyContacts: [{
        name: String,
        phone: String,
        relationship: String,
        email: String,
        priority: { type: Number, default: 1 }
    }],
    caregivers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        accessLevel: {
            type: String,
            enum: ['view', 'manage', 'full'],
            default: 'view'
        },
        addedAt: { type: Date, default: Date.now }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    profileImage: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordOtp: String,
    resetPasswordExpires: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for age calculation
userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update updatedAt timestamp
userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
            name: this.name
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024',
        { expiresIn: '7d' }
    );
};

// Instance method to get user summary
userSchema.methods.getSummary = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        age: this.age,
        bloodGroup: this.bloodGroup,
        allergies: this.allergies,
        medicalConditions: this.medicalConditions.length,
        emergencyContacts: this.emergencyContacts.length,
        createdAt: this.createdAt
    };
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to count active users
userSchema.statics.countActiveUsers = function () {
    return this.countDocuments({ isActive: true });
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'emergencyContacts.priority': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;