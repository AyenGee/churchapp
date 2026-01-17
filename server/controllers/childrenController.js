const { supabase } = require('../config/db');

// Get all children
const getAllChildren = async (req, res) => {
    try {
        const { search, class: className, active } = req.query;
        let query = supabase.from('children').select('*');

        if (search) {
            query = query.or(`name.ilike.%${search}%,class.ilike.%${search}%`);
        }

        if (className) {
            query = query.eq('class', className);
        }

        if (active !== undefined) {
            query = query.eq('is_active', active === 'true');
        }

        query = query.order('name', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        // Transform data to match frontend expectations (camelCase)
        const children = data.map(child => ({
            _id: child.id,
            name: child.name,
            age: child.age,
            class: child.class,
            parentGuardianName: child.parent_guardian_name,
            parentGuardianContact: child.parent_guardian_contact,
            parentGuardianEmail: child.parent_guardian_email,
            notes: child.notes,
            isActive: child.is_active,
            createdAt: child.created_at,
            updatedAt: child.updated_at
        }));

        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single child
const getChildById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('children')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Child not found' });
        }

        const child = {
            _id: data.id,
            name: data.name,
            age: data.age,
            class: data.class,
            parentGuardianName: data.parent_guardian_name,
            parentGuardianContact: data.parent_guardian_contact,
            parentGuardianEmail: data.parent_guardian_email,
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.json(child);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create child
const createChild = async (req, res) => {
    try {
        // Transform camelCase to snake_case for database
        const childData = {
            name: req.body.name,
            age: req.body.age,
            class: req.body.class,
            parent_guardian_name: req.body.parentGuardianName || null,
            parent_guardian_contact: req.body.parentGuardianContact || null,
            parent_guardian_email: req.body.parentGuardianEmail || null,
            notes: req.body.notes || null,
            is_active: req.body.isActive !== undefined ? req.body.isActive : true
        };

        const { data, error } = await supabase
            .from('children')
            .insert([childData])
            .select()
            .single();

        if (error) throw error;

        const child = {
            _id: data.id,
            name: data.name,
            age: data.age,
            class: data.class,
            parentGuardianName: data.parent_guardian_name,
            parentGuardianContact: data.parent_guardian_contact,
            parentGuardianEmail: data.parent_guardian_email,
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.status(201).json(child);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update child
const updateChild = async (req, res) => {
    try {
        // Transform camelCase to snake_case
        const updateData = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.age !== undefined) updateData.age = req.body.age;
        if (req.body.class !== undefined) updateData.class = req.body.class;
        if (req.body.parentGuardianName !== undefined) updateData.parent_guardian_name = req.body.parentGuardianName;
        if (req.body.parentGuardianContact !== undefined) updateData.parent_guardian_contact = req.body.parentGuardianContact;
        if (req.body.parentGuardianEmail !== undefined) updateData.parent_guardian_email = req.body.parentGuardianEmail;
        if (req.body.notes !== undefined) updateData.notes = req.body.notes;
        if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;

        const { data, error } = await supabase
            .from('children')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Child not found' });
        }

        const child = {
            _id: data.id,
            name: data.name,
            age: data.age,
            class: data.class,
            parentGuardianName: data.parent_guardian_name,
            parentGuardianContact: data.parent_guardian_contact,
            parentGuardianEmail: data.parent_guardian_email,
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.json(child);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete child (soft delete by setting isActive to false)
const deleteChild = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('children')
            .update({ is_active: false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Child not found' });
        }

        const child = {
            _id: data.id,
            name: data.name,
            age: data.age,
            class: data.class,
            parentGuardianName: data.parent_guardian_name,
            parentGuardianContact: data.parent_guardian_contact,
            parentGuardianEmail: data.parent_guardian_email,
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

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
