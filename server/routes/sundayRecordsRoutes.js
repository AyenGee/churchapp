const express = require('express');
const router = express.Router();
const {
    getAllSundayRecords,
    getSundayRecordById,
    createSundayRecord,
    updateSundayRecord,
    deleteSundayRecord
} = require('../controllers/sundayRecordsController');

// GET /api/sunday-records - Get all Sunday records (with optional filters)
router.get('/', getAllSundayRecords);

// GET /api/sunday-records/:id - Get single Sunday record
router.get('/:id', getSundayRecordById);

// POST /api/sunday-records - Create new Sunday record
router.post('/', createSundayRecord);

// PUT /api/sunday-records/:id - Update Sunday record
router.put('/:id', updateSundayRecord);

// DELETE /api/sunday-records/:id - Delete Sunday record
router.delete('/:id', deleteSundayRecord);

module.exports = router;

