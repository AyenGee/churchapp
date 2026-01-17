const { supabase } = require('../config/db');

// Get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const { search, role, active } = req.query;
        let query = supabase.from('teachers').select('*');

        if (search) {
            query = query.or(`name.ilike.%${search}%,role.ilike.%${search}%`);
        }

        if (role) {
            query = query.eq('role', role);
        }

        if (active !== undefined) {
            query = query.eq('is_active', active === 'true');
        }

        query = query.order('name', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        const teachers = data.map(teacher => ({
            _id: teacher.id,
            name: teacher.name,
            role: teacher.role,
            contact: teacher.contact,
            email: teacher.email,
            classes: teacher.classes || [],
            notes: teacher.notes,
            isActive: teacher.is_active,
            createdAt: teacher.created_at,
            updatedAt: teacher.updated_at
        }));

        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single teacher
const getTeacherById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const teacher = {
            _id: data.id,
            name: data.name,
            role: data.role,
            contact: data.contact,
            email: data.email,
            classes: data.classes || [],
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.json(teacher);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create teacher
const createTeacher = async (req, res) => {
    try {
        const teacherData = {
            name: req.body.name,
            role: req.body.role,
            contact: req.body.contact || null,
            email: req.body.email || null,
            classes: req.body.classes || [],
            notes: req.body.notes || null,
            is_active: req.body.isActive !== undefined ? req.body.isActive : true
        };

        const { data, error } = await supabase
            .from('teachers')
            .insert([teacherData])
            .select()
            .single();

        if (error) throw error;

        const teacher = {
            _id: data.id,
            name: data.name,
            role: data.role,
            contact: data.contact,
            email: data.email,
            classes: data.classes || [],
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.status(201).json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update teacher
const updateTeacher = async (req, res) => {
    try {
        const updateData = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.role !== undefined) updateData.role = req.body.role;
        if (req.body.contact !== undefined) updateData.contact = req.body.contact;
        if (req.body.email !== undefined) updateData.email = req.body.email;
        if (req.body.classes !== undefined) updateData.classes = req.body.classes;
        if (req.body.notes !== undefined) updateData.notes = req.body.notes;
        if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;

        const { data, error } = await supabase
            .from('teachers')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const teacher = {
            _id: data.id,
            name: data.name,
            role: data.role,
            contact: data.contact,
            email: data.email,
            classes: data.classes || [],
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete teacher (soft delete)
const deleteTeacher = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('teachers')
            .update({ is_active: false })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const teacher = {
            _id: data.id,
            name: data.name,
            role: data.role,
            contact: data.contact,
            email: data.email,
            classes: data.classes || [],
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

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
