const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Medication name is required'],
        trim: true,
        minlength: [2, 'Medication name must be at least 2 characters'],
        maxlength: [100, 'Medication name cannot exceed 100 characters']
    },
    color: {
        type: String,
        default: '#10b981'
    },
    genericName: {
        type: String,
        trim: true
    },
    brandName: {
        type: String,
        trim: true
    },
    dosage: {
        type: String, // Match frontend "500mg"
        required: [true, 'Dosage is required']
    },
    schedule: {
        frequency: {
            type: String,
            required: true,
            enum: ['Once', 'Daily', 'Weekly', 'Monthly', 'As needed', 'Custom'],
            default: 'Daily'
        },
        times: [{
            type: Number // Array of minutes from midnight (e.g. 540 for 9:00 AM)
        }],
        startDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        endDate: Date
    },
    instructions: {
        takeWith: {
            type: String,
            enum: ['empty-stomach', 'with-food', 'before-food', 'after-food', 'with-milk', null],
            default: null
        },
        specialInstructions: {
            type: String,
            maxlength: [500, 'Instructions cannot exceed 500 characters']
        },
        storage: {
            type: String,
            enum: ['room-temp', 'refrigerate', 'cool-dry-place', 'avoid-sunlight', null],
            default: null
        }
    },
    inventory: {
        currentQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
            min: 1
        },
        enabled: {
            type: Boolean,
            default: true
        },
        lastRefillDate: Date
    },
    reminders: {
        enabled: {
            type: Boolean,
            default: true
        },
        advanceTime: {
            type: Number,
            min: 0,
            max: 120,
            default: 30
        },
        methods: [{
            type: String,
            enum: ['push', 'sms', 'email', 'voice'],
            default: 'push'
        }],
        defaultMethods: {
            type: [String],
            enum: ['push', 'sms', 'email', 'voice'],
            default: ['push', 'sms', 'email', 'voice'] // Enable all methods by default
        },
        snoozeDuration: {
            type: Number,
            min: 5,
            max: 60,
            default: 10
        }
    },
    sideEffects: [{
        name: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe', 'critical']
        },
        experienced: {
            type: Boolean,
            default: false
        },
        notes: String,
        reportedAt: Date
    }],
    interactions: [{
        withMedication: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical']
        },
        description: String,
        recommendation: String,
        confirmed: {
            type: Boolean,
            default: false
        },
        source: String,
        detectedAt: {
            type: Date,
            default: Date.now
        }
    }],
    adherence: {
        totalDoses: {
            type: Number,
            default: 0
        },
        takenDoses: {
            type: Number,
            default: 0
        },
        missedDoses: {
            type: Number,
            default: 0
        },
        adherenceRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        lastTaken: Date,
        streak: {
            current: {
                type: Number,
                default: 0
            },
            longest: {
                type: Number,
                default: 0
            }
        }
    },
    prescription: {
        prescribedBy: String,
        prescriptionDate: Date,
        prescriptionImage: String,
        refills: {
            total: Number,
            remaining: Number
        },
        pharmacy: {
            name: String,
            phone: String,
            address: String
        }
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'stopped', 'paused'],
        default: 'active'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    nextReminder: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for adherence percentage
medicationSchema.virtual('adherencePercentage').get(function () {
    if (this.adherence.totalDoses === 0) return 0;
    return (this.adherence.takenDoses / this.adherence.totalDoses) * 100;
});

// Virtual for next dose time
medicationSchema.virtual('nextDose').get(function () {
    if (!this.nextReminder) return null;
    return this.nextReminder;
});

// Pre-save middleware to update adherence rate
medicationSchema.pre('save', function (next) {
    if (this.adherence.totalDoses > 0) {
        this.adherence.adherenceRate = (this.adherence.takenDoses / this.adherence.totalDoses) * 100;
    }
    this.updatedAt = Date.now();
    next();
});

// Method to mark dose as taken
medicationSchema.methods.markAsTaken = function (notes) {
    this.adherence.takenDoses += 1;
    this.adherence.totalDoses += 1;
    this.adherence.lastTaken = new Date();

    // Update streak
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.adherence.lastTaken.toDateString() === yesterday.toDateString()) {
        this.adherence.streak.current += 1;
        if (this.adherence.streak.current > this.adherence.streak.longest) {
            this.adherence.streak.longest = this.adherence.streak.current;
        }
    } else {
        this.adherence.streak.current = 1;
    }

    if (notes) {
        this.notes = notes;
    }

    // Update inventory if enabled
    if (this.inventory && this.inventory.enabled && this.inventory.currentQuantity > 0) {
        this.inventory.currentQuantity -= 1; // Assume 1 unit per dose for now

        if (this.inventory.currentQuantity <= this.inventory.lowStockThreshold) {
            console.log(`⚠️ Low Stock Alert: ${this.name} has only ${this.inventory.currentQuantity} left!`);
            // In a real app, trigger NotificationService here
        }
    }

    return this.save();
};

// Method to mark dose as missed
medicationSchema.methods.markAsMissed = function () {
    this.adherence.missedDoses += 1;
    this.adherence.totalDoses += 1;
    this.adherence.streak.current = 0;

    return this.save();
};

// Method to update next reminder
medicationSchema.methods.updateNextReminder = function () {
    if (!this.schedule.times || this.schedule.times.length === 0) {
        return null;
    }

    const now = new Date();
    let nextTime = null;

    for (const minutesFromMidnight of this.schedule.times) {
        const reminderTime = new Date();
        const hours = Math.floor(minutesFromMidnight / 60);
        const minutes = minutesFromMidnight % 60;

        reminderTime.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        if (!nextTime || reminderTime < nextTime) {
            nextTime = reminderTime;
        }
    }

    this.nextReminder = nextTime;
    return nextTime;
};

// Static method to find active medications
medicationSchema.statics.findActiveByUser = function (userId) {
    return this.find({
        user: userId,
        status: 'active',
        isArchived: false
    }).sort({ nextReminder: 1 });
};

// Static method to get adherence statistics
medicationSchema.statics.getAdherenceStats = function (userId) {
    return this.aggregate([
        {
            $match: {
                user: mongoose.Types.ObjectId(userId),
                status: 'active'
            }
        },
        {
            $group: {
                _id: null,
                totalMedications: { $sum: 1 },
                averageAdherence: { $avg: '$adherence.adherenceRate' },
                totalDoses: { $sum: '$adherence.totalDoses' },
                takenDoses: { $sum: '$adherence.takenDoses' },
                missedDoses: { $sum: '$adherence.missedDoses' }
            }
        }
    ]);
};

// Indexes
medicationSchema.index({ user: 1, status: 1 });
medicationSchema.index({ nextReminder: 1 });
medicationSchema.index({ user: 1, nextReminder: 1 });
medicationSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
medicationSchema.index({ createdAt: -1 });

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication;