const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true
    },
    eventType: {
        type: String,
        required: [true, 'Event type is required'],
        trim: true,
        enum: ['Outing', 'Camp', 'Concert', 'Conference', 'Workshop', 'Special Service', 'Other'],
        default: 'Other'
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date
    },
    location: {
        type: String,
        trim: true
    },
    attendance: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child'
    }],
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }],
    notes: {
        type: String,
        trim: true
    },
    outcomes: {
        type: String,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster date queries
eventSchema.index({ startDate: -1 });
eventSchema.index({ eventType: 1 });

module.exports = mongoose.model('Event', eventSchema);

