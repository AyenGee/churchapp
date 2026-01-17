const Child = require('../models/Child');

// Get all children
const getAllChildren = async (req, res) => {
    try {
        const { search, class: className, active } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { class: { $regex: search, $options: 'i' } }
            ];
        }

        if (className) {
            query.class = className;
        }

        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const children = await Child.find(query).sort({ name: 1 });
        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single child
const getChildById = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id);
        if (!child) {
            return res.status(404).json({ error: 'Child not found' });
        }
        res.json(child);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create child
const createChild = async (req, res) => {
    try {
        const child = new Child(req.body);
        await child.save();
        res.status(201).json(child);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update child
const updateChild = async (req, res) => {
    try {
        const child = await Child.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!child) {
            return res.status(404).json({ error: 'Child not found' });
        }
        res.json(child);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete child (soft delete by setting isActive to false)
const deleteChild = async (req, res) => {
    try {
        const child = await Child.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!child) {
            return res.status(404).json({ error: 'Child not found' });
        }
        res.json({ message: 'Child deactivated successfully', child });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllChildren,
    getChildById,
    createChild,
    updateChild,
    deleteChild
};

