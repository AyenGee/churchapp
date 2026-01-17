const Event = require('../models/Event');
const Child = require('../models/Child');
const Teacher = require('../models/Teacher');

// Get all events
const getAllEvents = async (req, res) => {
    try {
        const { search, eventType, startDate, endDate, completed } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { eventName: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        if (eventType) {
            query.eventType = eventType;
        }

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        if (completed !== undefined) {
            query.isCompleted = completed === 'true';
        }

        const events = await Event.find(query)
            .populate('attendance', 'name class')
            .populate('teachers', 'name role')
            .sort({ startDate: -1 });

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single event
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('attendance', 'name age class parentGuardianName parentGuardianContact')
            .populate('teachers', 'name role contact email');
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create event
const createEvent = async (req, res) => {
    try {
        // Validate children and teachers exist
        if (req.body.attendance && req.body.attendance.length > 0) {
            const children = await Child.find({ _id: { $in: req.body.attendance } });
            if (children.length !== req.body.attendance.length) {
                return res.status(400).json({ error: 'One or more children not found' });
            }
        }

        if (req.body.teachers && req.body.teachers.length > 0) {
            const teachers = await Teacher.find({ _id: { $in: req.body.teachers } });
            if (teachers.length !== req.body.teachers.length) {
                return res.status(400).json({ error: 'One or more teachers not found' });
            }
        }

        const event = new Event(req.body);
        await event.save();
        
        const populatedEvent = await Event.findById(event._id)
            .populate('attendance', 'name class')
            .populate('teachers', 'name role');

        res.status(201).json(populatedEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update event
const updateEvent = async (req, res) => {
    try {
        if (req.body.attendance && req.body.attendance.length > 0) {
            const children = await Child.find({ _id: { $in: req.body.attendance } });
            if (children.length !== req.body.attendance.length) {
                return res.status(400).json({ error: 'One or more children not found' });
            }
        }

        if (req.body.teachers && req.body.teachers.length > 0) {
            const teachers = await Teacher.find({ _id: { $in: req.body.teachers } });
            if (teachers.length !== req.body.teachers.length) {
                return res.status(400).json({ error: 'One or more teachers not found' });
            }
        }

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('attendance', 'name class')
        .populate('teachers', 'name role');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete event
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};

