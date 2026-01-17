const express = require('express');
const router = express.Router();
const {
    getAllChildren,
    getChildById,
    createChild,
    updateChild,
    deleteChild
} = require('../controllers/childrenController');

// GET /api/children - Get all children (with optional search, class, active filters)
router.get('/', getAllChildren);

// GET /api/children/:id - Get single child
router.get('/:id', getChildById);

// POST /api/children - Create new child
router.post('/', createChild);

// PUT /api/children/:id - Update child
router.put('/:id', updateChild);

// DELETE /api/children/:id - Delete child (soft delete)
router.delete('/:id', deleteChild);

module.exports = router;

