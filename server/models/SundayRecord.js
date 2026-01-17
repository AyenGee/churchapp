const mongoose = require('mongoose');

const sundayRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }],
    childrenPresent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child'
    }],
    lessonTitle: {
        type: String,
        trim: true
    },
    bibleVerses: [{
        type: String,
        trim: true
    }],
    lessonNotes: {
        type: String,
        trim: true
    },
    offeringAmount: {
        type: Number,
        default: 0,
        min: [0, 'Offering amount must be positive']
    },
    offeringPurpose: {
        type: String,
        trim: true
    },
    announcements: {
        type: String,
        trim: true
    },
    specialNotes: {
        type: String,
        trim: true
    },
    isSpecialSunday: {
        type: Boolean,
        default: false
    },
    specialTheme: {
        type: String,
        trim: true
    },
    isCombinedClass: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster date queries
sundayRecordSchema.index({ date: -1 });
sundayRecordSchema.index({ class: 1, date: -1 });

module.exports = mongoose.model('SundayRecord', sundayRecordSchema);

