const express = require('express');
const router = express.Router();
const {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
} = require('../controllers/teachersController');

// GET /api/teachers - Get all teachers (with optional search, role, active filters)
router.get('/', getAllTeachers);

// GET /api/teachers/:id - Get single teacher
router.get('/:id', getTeacherById);

// POST /api/teachers - Create new teacher
router.post('/', createTeacher);

// PUT /api/teachers/:id - Update teacher
router.put('/:id', updateTeacher);

// DELETE /api/teachers/:id - Delete teacher (soft delete)
router.delete('/:id', deleteTeacher);

module.exports = router;

