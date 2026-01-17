const SundayRecord = require('../models/SundayRecord');
const Event = require('../models/Event');
const Child = require('../models/Child');
const Teacher = require('../models/Teacher');

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};

        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.$gte = new Date(startDate);
            if (endDate) dateFilter.date.$lte = new Date(endDate);
        }

        // Get counts
        const totalChildren = await Child.countDocuments({ isActive: true });
        const totalTeachers = await Teacher.countDocuments({ isActive: true });
        const totalSundayRecords = await SundayRecord.countDocuments(dateFilter);
        const totalEvents = await Event.countDocuments();

        // Get recent Sunday records
        const recentRecords = await SundayRecord.find(dateFilter)
            .populate('childrenPresent', 'name class')
            .populate('teachers', 'name')
            .sort({ date: -1 })
            .limit(5);

        // Get upcoming events
        const upcomingEvents = await Event.find({
            startDate: { $gte: new Date() },
            isCompleted: false
        })
            .populate('attendance', 'name')
            .sort({ startDate: 1 })
            .limit(5);

        // Calculate average attendance
        const records = await SundayRecord.find(dateFilter).populate('childrenPresent');
        let totalAttendance = 0;
        let recordCount = 0;

        records.forEach(record => {
            if (record.childrenPresent && record.childrenPresent.length > 0) {
                totalAttendance += record.childrenPresent.length;
                recordCount++;
            }
        });

        const averageAttendance = recordCount > 0 ? (totalAttendance / recordCount).toFixed(1) : 0;

        res.json({
            summary: {
                totalChildren,
                totalTeachers,
                totalSundayRecords,
                totalEvents,
                averageAttendance: parseFloat(averageAttendance)
            },
            recentRecords,
            upcomingEvents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get monthly attendance report
const getMonthlyAttendance = async (req, res) => {
    try {
        const { year, month, class: className } = req.query;
        
        let startDate, endDate;
        if (year && month) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59);
        } else {
            // Default to current month
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        const query = {
            date: { $gte: startDate, $lte: endDate }
        };

        if (className) {
            query.class = className;
        }

        const records = await SundayRecord.find(query)
            .populate('childrenPresent', 'name class age')
            .sort({ date: -1 });

        // Calculate attendance statistics
        const attendanceByDate = records.map(record => ({
            date: record.date,
            class: record.class,
            attendanceCount: record.childrenPresent ? record.childrenPresent.length : 0,
            children: record.childrenPresent
        }));

        const totalAttendance = attendanceByDate.reduce((sum, record) => sum + record.attendanceCount, 0);
        const averageAttendance = records.length > 0 ? (totalAttendance / records.length).toFixed(1) : 0;

        // Get unique children who attended at least once
        const allChildrenIds = new Set();
        records.forEach(record => {
            if (record.childrenPresent) {
                record.childrenPresent.forEach(child => {
                    allChildrenIds.add(child._id.toString());
                });
            }
        });

        res.json({
            period: {
                startDate,
                endDate
            },
            totalRecords: records.length,
            totalAttendance,
            averageAttendance: parseFloat(averageAttendance),
            uniqueChildrenCount: allChildrenIds.size,
            attendanceByDate,
            records
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get child attendance history
const getChildAttendanceHistory = async (req, res) => {
    try {
        const childId = req.params.childId;
        const { startDate, endDate } = req.query;

        const query = {
            childrenPresent: childId
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const records = await SundayRecord.find(query)
            .populate('teachers', 'name')
            .select('date class lessonTitle bibleVerses')
            .sort({ date: -1 });

        const child = await Child.findById(childId);

        if (!child) {
            return res.status(404).json({ error: 'Child not found' });
        }

        res.json({
            child: {
                name: child.name,
                class: child.class,
                age: child.age
            },
            totalSundays: records.length,
            records
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get event participation report
const getEventParticipation = async (req, res) => {
    try {
        const { startDate, endDate, eventType } = req.query;
        
        const query = {};
        
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        if (eventType) {
            query.eventType = eventType;
        }

        const events = await Event.find(query)
            .populate('attendance', 'name class age')
            .populate('teachers', 'name role')
            .sort({ startDate: -1 });

        const participationStats = events.map(event => ({
            eventName: event.eventName,
            eventType: event.eventType,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            attendanceCount: event.attendance ? event.attendance.length : 0,
            attendance: event.attendance,
            teachers: event.teachers
        }));

        const totalParticipants = participationStats.reduce((sum, stat) => sum + stat.attendanceCount, 0);

        res.json({
            totalEvents: events.length,
            totalParticipants,
            averageParticipation: events.length > 0 ? (totalParticipants / events.length).toFixed(1) : 0,
            participationStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDashboardSummary,
    getMonthlyAttendance,
    getChildAttendanceHistory,
    getEventParticipation
};

