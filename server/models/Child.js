const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Child name is required'],
        trim: true
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [0, 'Age must be a positive number']
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    parentGuardianName: {
        type: String,
        trim: true
    },
    parentGuardianContact: {
        type: String,
        trim: true
    },
    parentGuardianEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Child', childSchema);

