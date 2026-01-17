const express = require('express');
const router = express.Router();
const {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventsController');

// GET /api/events - Get all events (with optional filters)
router.get('/', getAllEvents);

// GET /api/events/:id - Get single event
router.get('/:id', getEventById);

// POST /api/events - Create new event
router.post('/', createEvent);

// PUT /api/events/:id - Update event
router.put('/:id', updateEvent);

// DELETE /api/events/:id - Delete event
router.delete('/:id', deleteEvent);

module.exports = router;

