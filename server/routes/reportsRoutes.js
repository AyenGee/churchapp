const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getMonthlyAttendance,
    getChildAttendanceHistory,
    getEventParticipation
} = require('../controllers/reportsController');

// GET /api/reports/dashboard - Get dashboard summary
router.get('/dashboard', getDashboardSummary);

// GET /api/reports/monthly-attendance - Get monthly attendance report
router.get('/monthly-attendance', getMonthlyAttendance);

// GET /api/reports/child/:childId - Get child attendance history
router.get('/child/:childId', getChildAttendanceHistory);

// GET /api/reports/events - Get event participation report
router.get('/events', getEventParticipation);

module.exports = router;

