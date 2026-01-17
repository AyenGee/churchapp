const SundayRecord = require('../models/SundayRecord');
const Child = require('../models/Child');
const Teacher = require('../models/Teacher');

// Get all Sunday records
const getAllSundayRecords = async (req, res) => {
    try {
        const { search, class: className, startDate, endDate } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { lessonTitle: { $regex: search, $options: 'i' } },
                { class: { $regex: search, $options: 'i' } },
                { specialTheme: { $regex: search, $options: 'i' } }
            ];
        }

        if (className) {
            query.class = className;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const records = await SundayRecord.find(query)
            .populate('teachers', 'name role')
            .populate('childrenPresent', 'name class')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single Sunday record
const getSundayRecordById = async (req, res) => {
    try {
        const record = await SundayRecord.findById(req.params.id)
            .populate('teachers', 'name role contact email')
            .populate('childrenPresent', 'name age class');
        
        if (!record) {
            return res.status(404).json({ error: 'Sunday record not found' });
        }
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create Sunday record
const createSundayRecord = async (req, res) => {
    try {
        // Validate children and teachers exist
        if (req.body.childrenPresent && req.body.childrenPresent.length > 0) {
            const children = await Child.find({ _id: { $in: req.body.childrenPresent } });
            if (children.length !== req.body.childrenPresent.length) {
                return res.status(400).json({ error: 'One or more children not found' });
            }
        }

        if (req.body.teachers && req.body.teachers.length > 0) {
            const teachers = await Teacher.find({ _id: { $in: req.body.teachers } });
            if (teachers.length !== req.body.teachers.length) {
                return res.status(400).json({ error: 'One or more teachers not found' });
            }
        }

        const record = new SundayRecord(req.body);
        await record.save();
        
        const populatedRecord = await SundayRecord.findById(record._id)
            .populate('teachers', 'name role')
            .populate('childrenPresent', 'name class');

        res.status(201).json(populatedRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Sunday record
const updateSundayRecord = async (req, res) => {
    try {
        if (req.body.childrenPresent && req.body.childrenPresent.length > 0) {
            const children = await Child.find({ _id: { $in: req.body.childrenPresent } });
            if (children.length !== req.body.childrenPresent.length) {
                return res.status(400).json({ error: 'One or more children not found' });
            }
        }

        if (req.body.teachers && req.body.teachers.length > 0) {
            const teachers = await Teacher.find({ _id: { $in: req.body.teachers } });
            if (teachers.length !== req.body.teachers.length) {
                return res.status(400).json({ error: 'One or more teachers not found' });
            }
        }

        const record = await SundayRecord.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('teachers', 'name role')
        .populate('childrenPresent', 'name class');

        if (!record) {
            return res.status(404).json({ error: 'Sunday record not found' });
        }
        res.json(record);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Sunday record
const deleteSundayRecord = async (req, res) => {
    try {
        const record = await SundayRecord.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ error: 'Sunday record not found' });
        }
        res.json({ message: 'Sunday record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllSundayRecords,
    getSundayRecordById,
    createSundayRecord,
    updateSundayRecord,
    deleteSundayRecord
};

