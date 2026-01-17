const { supabase } = require('../config/db');

// Helper function to populate teachers and children for a record
async function populateRecord(recordId) {
    // Get the record
    const { data: record, error: recordError } = await supabase
        .from('sunday_records')
        .select('*')
        .eq('id', recordId)
        .single();

    if (recordError || !record) return null;

    // Get teachers
    const { data: teacherLinks } = await supabase
        .from('sunday_record_teachers')
        .select('teacher_id')
        .eq('sunday_record_id', recordId);

    const teacherIds = teacherLinks?.map(link => link.teacher_id) || [];
    
    let teachers = [];
    if (teacherIds.length > 0) {
        const { data: teachersData } = await supabase
            .from('teachers')
            .select('id, name, role, contact, email')
            .in('id', teacherIds);
        teachers = teachersData || [];
    }

    // Get children
    const { data: childLinks } = await supabase
        .from('sunday_record_children')
        .select('child_id')
        .eq('sunday_record_id', recordId);

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
        _id: record.id,
        date: record.date,
        class: record.class,
        teachers: teachers.map(t => ({ _id: t.id, name: t.name, role: t.role, contact: t.contact, email: t.email })),
        childrenPresent: children.map(c => ({
            _id: c.id,
            name: c.name,
            age: c.age,
            class: c.class,
            parentGuardianName: c.parent_guardian_name,
            parentGuardianContact: c.parent_guardian_contact
        })),
        lessonTitle: record.lesson_title,
        bibleVerses: record.bible_verses || [],
        lessonNotes: record.lesson_notes,
        offeringAmount: parseFloat(record.offering_amount) || 0,
        offeringPurpose: record.offering_purpose,
        announcements: record.announcements,
        specialNotes: record.special_notes,
        isSpecialSunday: record.is_special_sunday,
        specialTheme: record.special_theme,
        isCombinedClass: record.is_combined_class,
        createdAt: record.created_at,
        updatedAt: record.updated_at
    };
}

// Get all Sunday records
const getAllSundayRecords = async (req, res) => {
    try {
        const { search, class: className, startDate, endDate } = req.query;
        let query = supabase.from('sunday_records').select('*');

        if (search) {
            query = query.or(`lesson_title.ilike.%${search}%,class.ilike.%${search}%,special_theme.ilike.%${search}%`);
        }

        if (className) {
            query = query.eq('class', className);
        }

        if (startDate || endDate) {
            if (startDate) query = query.gte('date', startDate);
            if (endDate) query = query.lte('date', endDate);
        }

        query = query.order('date', { ascending: false });

        const { data: records, error } = await query;
        if (error) throw error;

        // Populate all records
        const populatedRecords = await Promise.all(
            records.map(record => populateRecord(record.id))
        );

        res.json(populatedRecords.filter(r => r !== null));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single Sunday record
const getSundayRecordById = async (req, res) => {
    try {
        const record = await populateRecord(req.params.id);
        
        if (!record) {
            return res.status(404).json({ error: 'Sunday record not found' });
        }
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create Sunday record
const createSundayRecord = async (req, res) => {
    try {
        // Validate children and teachers exist
        if (req.body.childrenPresent && req.body.childrenPresent.length > 0) {
            const { data: children, error: childError } = await supabase
                .from('children')
                .select('id')
                .in('id', req.body.childrenPresent);
            
            if (childError || !children || children.length !== req.body.childrenPresent.length) {
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

        // Create the record
        const recordData = {
            date: req.body.date,
            class: req.body.class,
            lesson_title: req.body.lessonTitle || null,
            bible_verses: req.body.bibleVerses || [],
            lesson_notes: req.body.lessonNotes || null,
            offering_amount: req.body.offeringAmount || 0,
            offering_purpose: req.body.offeringPurpose || null,
            announcements: req.body.announcements || null,
            special_notes: req.body.specialNotes || null,
            is_special_sunday: req.body.isSpecialSunday || false,
            special_theme: req.body.specialTheme || null,
            is_combined_class: req.body.isCombinedClass || false
        };

        const { data: record, error: recordError } = await supabase
            .from('sunday_records')
            .insert([recordData])
            .select()
            .single();

        if (recordError) throw recordError;

        // Create junction table entries for teachers
        if (req.body.teachers && req.body.teachers.length > 0) {
            const teacherLinks = req.body.teachers.map(teacherId => ({
                sunday_record_id: record.id,
                teacher_id: teacherId
            }));
            await supabase.from('sunday_record_teachers').insert(teacherLinks);
        }

        // Create junction table entries for children
        if (req.body.childrenPresent && req.body.childrenPresent.length > 0) {
            const childLinks = req.body.childrenPresent.map(childId => ({
                sunday_record_id: record.id,
                child_id: childId
            }));
            await supabase.from('sunday_record_children').insert(childLinks);
        }

        const populatedRecord = await populateRecord(record.id);
        res.status(201).json(populatedRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Sunday record
const updateSundayRecord = async (req, res) => {
    try {
        if (req.body.childrenPresent && req.body.childrenPresent.length > 0) {
            const { data: children } = await supabase
                .from('children')
                .select('id')
                .in('id', req.body.childrenPresent);
            
            if (!children || children.length !== req.body.childrenPresent.length) {
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

        // Update the record
        const updateData = {};
        if (req.body.date !== undefined) updateData.date = req.body.date;
        if (req.body.class !== undefined) updateData.class = req.body.class;
        if (req.body.lessonTitle !== undefined) updateData.lesson_title = req.body.lessonTitle;
        if (req.body.bibleVerses !== undefined) updateData.bible_verses = req.body.bibleVerses;
        if (req.body.lessonNotes !== undefined) updateData.lesson_notes = req.body.lessonNotes;
        if (req.body.offeringAmount !== undefined) updateData.offering_amount = req.body.offeringAmount;
        if (req.body.offeringPurpose !== undefined) updateData.offering_purpose = req.body.offeringPurpose;
        if (req.body.announcements !== undefined) updateData.announcements = req.body.announcements;
        if (req.body.specialNotes !== undefined) updateData.special_notes = req.body.specialNotes;
        if (req.body.isSpecialSunday !== undefined) updateData.is_special_sunday = req.body.isSpecialSunday;
        if (req.body.specialTheme !== undefined) updateData.special_theme = req.body.specialTheme;
        if (req.body.isCombinedClass !== undefined) updateData.is_combined_class = req.body.isCombinedClass;

        const { error: updateError } = await supabase
            .from('sunday_records')
            .update(updateData)
            .eq('id', req.params.id);

        if (updateError) throw updateError;

        // Update junction tables if relationships changed
        if (req.body.teachers !== undefined) {
            // Delete existing teacher links
            await supabase
                .from('sunday_record_teachers')
                .delete()
                .eq('sunday_record_id', req.params.id);

            // Insert new teacher links
            if (req.body.teachers.length > 0) {
                const teacherLinks = req.body.teachers.map(teacherId => ({
                    sunday_record_id: req.params.id,
                    teacher_id: teacherId
                }));
                await supabase.from('sunday_record_teachers').insert(teacherLinks);
            }
        }

        if (req.body.childrenPresent !== undefined) {
            // Delete existing child links
            await supabase
                .from('sunday_record_children')
                .delete()
                .eq('sunday_record_id', req.params.id);

            // Insert new child links
            if (req.body.childrenPresent.length > 0) {
                const childLinks = req.body.childrenPresent.map(childId => ({
                    sunday_record_id: req.params.id,
                    child_id: childId
                }));
                await supabase.from('sunday_record_children').insert(childLinks);
            }
        }

        const populatedRecord = await populateRecord(req.params.id);
        res.json(populatedRecord);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Sunday record
const deleteSundayRecord = async (req, res) => {
    try {
        // Cascade delete will handle junction tables
        const { error } = await supabase
            .from('sunday_records')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Sunday record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllSundayRecords,
    getSundayRecordById,
    createSundayRecord,
    updateSundayRecord,
    deleteSundayRecord
};
