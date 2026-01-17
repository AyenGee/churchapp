const { supabase } = require('../config/db');

// Helper function to populate Sunday record with teachers and children
async function populateRecordBasic(recordId) {
    const { data: record } = await supabase
        .from('sunday_records')
        .select('*')
        .eq('id', recordId)
        .single();

    if (!record) return null;

    const { data: childLinks } = await supabase
        .from('sunday_record_children')
        .select('child_id')
        .eq('sunday_record_id', recordId);

    const childIds = childLinks?.map(link => link.child_id) || [];
    let children = [];
    if (childIds.length > 0) {
        const { data: childrenData } = await supabase
            .from('children')
            .select('id, name, class, age')
            .in('id', childIds);
        children = childrenData || [];
    }

    const { data: teacherLinks } = await supabase
        .from('sunday_record_teachers')
        .select('teacher_id')
        .eq('sunday_record_id', recordId);

    const teacherIds = teacherLinks?.map(link => link.teacher_id) || [];
    let teachers = [];
    if (teacherIds.length > 0) {
        const { data: teachersData } = await supabase
            .from('teachers')
            .select('id, name')
            .in('id', teacherIds);
        teachers = teachersData || [];
    }

    return {
        _id: record.id,
        date: record.date,
        class: record.class,
        lessonTitle: record.lesson_title,
        childrenPresent: children.map(c => ({ _id: c.id, name: c.name, class: c.class, age: c.age })),
        teachers: teachers.map(t => ({ _id: t.id, name: t.name }))
    };
}

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateQuery = supabase.from('sunday_records').select('id', { count: 'exact', head: true });
        let recordsQuery = supabase.from('sunday_records').select('*');

        if (startDate || endDate) {
            if (startDate) {
                dateQuery = dateQuery.gte('date', startDate);
                recordsQuery = recordsQuery.gte('date', startDate);
            }
            if (endDate) {
                dateQuery = dateQuery.lte('date', endDate);
                recordsQuery = recordsQuery.lte('date', endDate);
            }
        }

        // Get counts
        const [childrenCount, teachersCount, recordsCount, eventsCount] = await Promise.all([
            supabase.from('children').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('is_active', true),
            dateQuery,
            supabase.from('events').select('id', { count: 'exact', head: true })
        ]);

        // Get recent Sunday records
        let recentQuery = recordsQuery.order('date', { ascending: false }).limit(5);
        const { data: recentRecordsData } = await recentQuery;
        const recentRecords = await Promise.all(
            (recentRecordsData || []).map(r => populateRecordBasic(r.id))
        );

        // Get upcoming events
        const today = new Date().toISOString().split('T')[0];
        const { data: upcomingEventsData } = await supabase
            .from('events')
            .select('*')
            .gte('start_date', today)
            .eq('is_completed', false)
            .order('start_date', { ascending: true })
            .limit(5);

        const upcomingEvents = await Promise.all(
            (upcomingEventsData || []).map(async (event) => {
                const { data: childLinks } = await supabase
                    .from('event_children')
                    .select('child_id')
                    .eq('event_id', event.id);
                
                const childIds = childLinks?.map(link => link.child_id) || [];
                let attendance = [];
                if (childIds.length > 0) {
                    const { data: childrenData } = await supabase
                        .from('children')
                        .select('id, name')
                        .in('id', childIds);
                    attendance = (childrenData || []).map(c => ({ _id: c.id, name: c.name }));
                }

                return {
                    _id: event.id,
                    eventName: event.event_name,
                    startDate: event.start_date,
                    location: event.location,
                    attendance
                };
            })
        );

        // Calculate average attendance
        const { data: allRecords } = await recordsQuery;
        let totalAttendance = 0;
        let recordCount = 0;

        for (const record of allRecords || []) {
            const { data: childLinks } = await supabase
                .from('sunday_record_children')
                .select('child_id')
                .eq('sunday_record_id', record.id);
            
            const count = childLinks?.length || 0;
            if (count > 0) {
                totalAttendance += count;
                recordCount++;
            }
        }

        const averageAttendance = recordCount > 0 ? (totalAttendance / recordCount).toFixed(1) : 0;

        res.json({
            summary: {
                totalChildren: childrenCount.count || 0,
                totalTeachers: teachersCount.count || 0,
                totalSundayRecords: recordsCount.count || 0,
                totalEvents: eventsCount.count || 0,
                averageAttendance: parseFloat(averageAttendance)
            },
            recentRecords: recentRecords.filter(r => r !== null),
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
            startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
            endDate = new Date(year, month, 0).toISOString().split('T')[0];
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        let query = supabase
            .from('sunday_records')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);

        if (className) {
            query = query.eq('class', className);
        }

        const { data: records, error } = await query.order('date', { ascending: false });
        if (error) throw error;

        const attendanceByDate = await Promise.all(
            (records || []).map(async (record) => {
                const { data: childLinks } = await supabase
                    .from('sunday_record_children')
                    .select('child_id')
                    .eq('sunday_record_id', record.id);

                const childIds = childLinks?.map(link => link.child_id) || [];
                let children = [];
                if (childIds.length > 0) {
                    const { data: childrenData } = await supabase
                        .from('children')
                        .select('id, name, class, age')
                        .in('id', childIds);
                    children = (childrenData || []).map(c => ({
                        _id: c.id,
                        name: c.name,
                        class: c.class,
                        age: c.age
                    }));
                }

                return {
                    date: record.date,
                    class: record.class,
                    attendanceCount: children.length,
                    children
                };
            })
        );

        const totalAttendance = attendanceByDate.reduce((sum, record) => sum + record.attendanceCount, 0);
        const averageAttendance = records.length > 0 ? (totalAttendance / records.length).toFixed(1) : 0;

        const allChildrenIds = new Set();
        attendanceByDate.forEach(record => {
            record.children.forEach(child => {
                allChildrenIds.add(child._id);
            });
        });

        res.json({
            period: { startDate, endDate },
            totalRecords: records.length,
            totalAttendance,
            averageAttendance: parseFloat(averageAttendance),
            uniqueChildrenCount: allChildrenIds.size,
            attendanceByDate,
            records: records.map(r => ({
                _id: r.id,
                date: r.date,
                class: r.class,
                lessonTitle: r.lesson_title,
                bibleVerses: r.bible_verses || []
            }))
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

        // Get records where this child was present
        const { data: childLinks } = await supabase
            .from('sunday_record_children')
            .select('sunday_record_id')
            .eq('child_id', childId);

        const recordIds = childLinks?.map(link => link.sunday_record_id) || [];
        
        if (recordIds.length === 0) {
            const { data: child } = await supabase
                .from('children')
                .select('id, name, age, class')
                .eq('id', childId)
                .single();

            if (!child) {
                return res.status(404).json({ error: 'Child not found' });
            }

            return res.json({
                child: { name: child.name, class: child.class, age: child.age },
                totalSundays: 0,
                records: []
            });
        }

        let query = supabase
            .from('sunday_records')
            .select('*')
            .in('id', recordIds);

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data: records } = await query.order('date', { ascending: false });

        // Get child info
        const { data: child } = await supabase
            .from('children')
            .select('id, name, age, class')
            .eq('id', childId)
            .single();

        if (!child) {
            return res.status(404).json({ error: 'Child not found' });
        }

        // Get teachers for each record
        const recordsWithTeachers = await Promise.all(
            (records || []).map(async (record) => {
                const { data: teacherLinks } = await supabase
                    .from('sunday_record_teachers')
                    .select('teacher_id')
                    .eq('sunday_record_id', record.id);

                const teacherIds = teacherLinks?.map(link => link.teacher_id) || [];
                let teachers = [];
                if (teacherIds.length > 0) {
                    const { data: teachersData } = await supabase
                        .from('teachers')
                        .select('id, name')
                        .in('id', teacherIds);
                    teachers = (teachersData || []).map(t => ({ _id: t.id, name: t.name }));
                }

                return {
                    date: record.date,
                    class: record.class,
                    lessonTitle: record.lesson_title,
                    bibleVerses: record.bible_verses || [],
                    teachers
                };
            })
        );

        res.json({
            child: { name: child.name, class: child.class, age: child.age },
            totalSundays: recordsWithTeachers.length,
            records: recordsWithTeachers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get event participation report
const getEventParticipation = async (req, res) => {
    try {
        const { startDate, endDate, eventType } = req.query;
        
        let query = supabase.from('events').select('*');

        if (startDate || endDate) {
            if (startDate) query = query.gte('start_date', startDate);
            if (endDate) query = query.lte('start_date', endDate);
        }

        if (eventType) {
            query = query.eq('event_type', eventType);
        }

        const { data: events } = await query.order('start_date', { ascending: false });

        const participationStats = await Promise.all(
            (events || []).map(async (event) => {
                const { data: childLinks } = await supabase
                    .from('event_children')
                    .select('child_id')
                    .eq('event_id', event.id);

                const childIds = childLinks?.map(link => link.child_id) || [];
                let attendance = [];
                if (childIds.length > 0) {
                    const { data: childrenData } = await supabase
                        .from('children')
                        .select('id, name, class, age')
                        .in('id', childIds);
                    attendance = (childrenData || []).map(c => ({
                        _id: c.id,
                        name: c.name,
                        class: c.class,
                        age: c.age
                    }));
                }

                const { data: teacherLinks } = await supabase
                    .from('event_teachers')
                    .select('teacher_id')
                    .eq('event_id', event.id);

                const teacherIds = teacherLinks?.map(link => link.teacher_id) || [];
                let teachers = [];
                if (teacherIds.length > 0) {
                    const { data: teachersData } = await supabase
                        .from('teachers')
                        .select('id, name, role')
                        .in('id', teacherIds);
                    teachers = (teachersData || []).map(t => ({ _id: t.id, name: t.name, role: t.role }));
                }

                return {
                    eventName: event.event_name,
                    eventType: event.event_type,
                    startDate: event.start_date,
                    endDate: event.end_date,
                    location: event.location,
                    attendanceCount: attendance.length,
                    attendance,
                    teachers
                };
            })
        );

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
