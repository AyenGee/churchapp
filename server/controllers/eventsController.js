const { supabase } = require('../config/db');

// Helper function to populate event with teachers and children
async function populateEvent(eventId) {
    // Get the event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (eventError || !event) return null;

    // Get teachers
    const { data: teacherLinks } = await supabase
        .from('event_teachers')
        .select('teacher_id')
        .eq('event_id', eventId);

    const teacherIds = teacherLinks?.map(link => link.teacher_id) || [];
    
    let teachers = [];
    if (teacherIds.length > 0) {
        const { data: teachersData } = await supabase
            .from('teachers')
            .select('id, name, role, contact, email')
            .in('id', teacherIds);
        teachers = teachersData || [];
    }

    // Get children (attendance)
    const { data: childLinks } = await supabase
        .from('event_children')
        .select('child_id')
        .eq('event_id', eventId);

    const childIds = childLinks?.map(link => link.child_id) || [];
    
    let children = [];
    if (childIds.length > 0) {
        const { data: childrenData } = await supabase
            .from('children')
            .select('id, name, age, class, parent_guardian_name, parent_guardian_contact')
            .in('id', childIds);
        children = childrenData || [];
    }

    return {
        _id: event.id,
        eventName: event.event_name,
        eventType: event.event_type,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        teachers: teachers.map(t => ({ _id: t.id, name: t.name, role: t.role, contact: t.contact, email: t.email })),
        attendance: children.map(c => ({
            _id: c.id,
            name: c.name,
            age: c.age,
            class: c.class,
            parentGuardianName: c.parent_guardian_name,
            parentGuardianContact: c.parent_guardian_contact
        })),
        notes: event.notes,
        outcomes: event.outcomes,
        isCompleted: event.is_completed,
        createdAt: event.created_at,
        updatedAt: event.updated_at
    };
}

// Get all events
const getAllEvents = async (req, res) => {
    try {
        const { search, eventType, startDate, endDate, completed } = req.query;
        let query = supabase.from('events').select('*');

        if (search) {
            query = query.or(`event_name.ilike.%${search}%,location.ilike.%${search}%`);
        }

        if (eventType) {
            query = query.eq('event_type', eventType);
        }

        if (startDate || endDate) {
            if (startDate) query = query.gte('start_date', startDate);
            if (endDate) query = query.lte('start_date', endDate);
        }

        if (completed !== undefined) {
            query = query.eq('is_completed', completed === 'true');
        }

        query = query.order('start_date', { ascending: false });

        const { data: events, error } = await query;
        if (error) throw error;

        // Populate all events
        const populatedEvents = await Promise.all(
            events.map(event => populateEvent(event.id))
        );

        res.json(populatedEvents.filter(e => e !== null));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single event
const getEventById = async (req, res) => {
    try {
        const event = await populateEvent(req.params.id);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create event
const createEvent = async (req, res) => {
    try {
        // Validate children and teachers exist
        if (req.body.attendance && req.body.attendance.length > 0) {
            const { data: children, error: childError } = await supabase
                .from('children')
                .select('id')
                .in('id', req.body.attendance);
            
            if (childError || !children || children.length !== req.body.attendance.length) {
                return res.status(400).json({ error: 'One or more children not found' });
            }
        }

        if (req.body.teachers && req.body.teachers.length > 0) {
            const { data: teachers, error: teacherError } = await supabase
                .from('teachers')
                .select('id')
                .in('id', req.body.teachers);
            
            if (teacherError || !teachers || teachers.length !== req.body.teachers.length) {
                return res.status(400).json({ error: 'One or more teachers not found' });
            }
        }

        // Create the event
        const eventData = {
            event_name: req.body.eventName,
            event_type: req.body.eventType,
            start_date: req.body.startDate,
            end_date: req.body.endDate || null,
            location: req.body.location || null,
            notes: req.body.notes || null,
            outcomes: req.body.outcomes || null,
            is_completed: req.body.isCompleted || false
        };

        const { data: event, error: eventError } = await supabase
            .from('events')
            .insert([eventData])
            .select()
            .single();

        if (eventError) throw eventError;

        // Create junction table entries for teachers
        if (req.body.teachers && req.body.teachers.length > 0) {
            const teacherLinks = req.body.teachers.map(teacherId => ({
                event_id: event.id,
                teacher_id: teacherId
            }));
            await supabase.from('event_teachers').insert(teacherLinks);
        }

        // Create junction table entries for children
        if (req.body.attendance && req.body.attendance.length > 0) {
            const childLinks = req.body.attendance.map(childId => ({
                event_id: event.id,
                child_id: childId
            }));
            await supabase.from('event_children').insert(childLinks);
        }

        const populatedEvent = await populateEvent(event.id);
        res.status(201).json(populatedEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update event
const updateEvent = async (req, res) => {
    try {
        if (req.body.attendance && req.body.attendance.length > 0) {
            const { data: children } = await supabase
                .from('children')
                .select('id')
                .in('id', req.body.attendance);
            
            if (!children || children.length !== req.body.attendance.length) {
                return res.status(400).json({ error: 'One or more children not found' });
            }
        }

        if (req.body.teachers && req.body.teachers.length > 0) {
            const { data: teachers } = await supabase
                .from('teachers')
                .select('id')
                .in('id', req.body.teachers);
            
            if (!teachers || teachers.length !== req.body.teachers.length) {
                return res.status(400).json({ error: 'One or more teachers not found' });
            }
        }

        // Update the event
        const updateData = {};
        if (req.body.eventName !== undefined) updateData.event_name = req.body.eventName;
        if (req.body.eventType !== undefined) updateData.event_type = req.body.eventType;
        if (req.body.startDate !== undefined) updateData.start_date = req.body.startDate;
        if (req.body.endDate !== undefined) updateData.end_date = req.body.endDate;
        if (req.body.location !== undefined) updateData.location = req.body.location;
        if (req.body.notes !== undefined) updateData.notes = req.body.notes;
        if (req.body.outcomes !== undefined) updateData.outcomes = req.body.outcomes;
        if (req.body.isCompleted !== undefined) updateData.is_completed = req.body.isCompleted;

        const { error: updateError } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', req.params.id);

        if (updateError) throw updateError;

        // Update junction tables if relationships changed
        if (req.body.teachers !== undefined) {
            await supabase
                .from('event_teachers')
                .delete()
                .eq('event_id', req.params.id);

            if (req.body.teachers.length > 0) {
                const teacherLinks = req.body.teachers.map(teacherId => ({
                    event_id: req.params.id,
                    teacher_id: teacherId
                }));
                await supabase.from('event_teachers').insert(teacherLinks);
            }
        }

        if (req.body.attendance !== undefined) {
            await supabase
                .from('event_children')
                .delete()
                .eq('event_id', req.params.id);

            if (req.body.attendance.length > 0) {
                const childLinks = req.body.attendance.map(childId => ({
                    event_id: req.params.id,
                    child_id: childId
                }));
                await supabase.from('event_children').insert(childLinks);
            }
        }

        const populatedEvent = await populateEvent(req.params.id);
        res.json(populatedEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete event
const deleteEvent = async (req, res) => {
    try {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
