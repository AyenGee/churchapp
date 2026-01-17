const Teacher = require('../models/Teacher');

// Get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const { search, role, active } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const teachers = await Teacher.find(query).sort({ name: 1 });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single teacher
const getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create teacher
const createTeacher = async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();
        res.status(201).json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update teacher
const updateTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete teacher (soft delete)
const deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        res.json({ message: 'Teacher deactivated successfully', teacher });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};

