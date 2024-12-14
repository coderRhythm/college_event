const db = require('../db'); 


exports.assignFaculty = (req, res) => {
    const { event_id, faculty_id } = req.query;

    // First check if event exists and is approved
    const eventQuery = 'SELECT status FROM events WHERE id = ?';

    db.query(eventQuery, [event_id], (eventErr, eventResults) => {
        if (eventErr) {
            console.error("Error checking event status:", eventErr);
            return res.status(500).send('Server error');
        }

        if (eventResults.length === 0) {
            console.error("No event found with this ID.");
            return res.status(404).send('Event not found');
        }

        // Check if event is approved
        if (eventResults[0].status !== 'approved') {
            console.error("Cannot assign faculty to unapproved event");
            return res.status(400).send('Cannot assign faculty to unapproved event');
        }

        // Check if faculty is already assigned to this event
        const checkAssignmentQuery = 'SELECT * FROM faculty WHERE event_id = ? AND faculty_prn = ?';
        
        db.query(checkAssignmentQuery, [event_id, faculty_id], (checkErr, checkResults) => {
            if (checkErr) {
                console.error("Error checking existing assignment:", checkErr);
                return res.status(500).send('Server error');
            }

            if (checkResults.length > 0) {
                console.error("Faculty already assigned to this event");
                return res.status(400).send('Faculty already assigned to this event');
            }

            // If event is approved and faculty not already assigned, proceed with faculty check
            const facultyQuery = 'SELECT name, faculty_id FROM users WHERE faculty_id = ? AND category = "faculty"';

            db.query(facultyQuery, [faculty_id], (err, results) => {
                if (err) {
                    console.error("Error fetching faculty data:", err);
                    return res.status(500).send('Server error');
                }

                if (results.length === 0) {
                    console.error("No faculty found with this ID.");
                    return res.status(404).send('Faculty not found');
                }

                const { name, faculty_id } = results[0];

                const insertQuery = 'INSERT INTO faculty (name, faculty_prn, event_id) VALUES (?, ?, ?)';

                db.query(insertQuery, [name, faculty_id, event_id], (err, result) => {
                    if (err) {
                        console.error("Error inserting assignment:", err);
                        return res.status(500).send('Server error');
                    }

                    // Send a success response
                    res.status(200).json({
                        success: true,
                        message: 'Faculty assigned successfully',
                        redirect: '/admin/events'
                    });
                });
            });
        });
    });
};
exports.updateEventDates = (req, res) => {
    const eventId = req.params.id;
    const { start_date, end_date } = req.body;  // Form data will be parsed by middleware like express.urlencoded()

    if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const query = 'UPDATE events SET start_date = ?, end_date = ? WHERE id = ?';

    db.query(query, [start_date, end_date, eventId], (err, result) => {
        if (err) {
            console.error("Error updating event dates:", err);
            return res.status(500).json({ success: false, message: 'Error updating event dates' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({ success: true, message: 'Event dates updated successfully' });
    });
};




exports.getEvents = (req, res) => {
    const eventsQuery = 'SELECT * FROM events';
    const facultiesQuery = 'SELECT * FROM users';  
    const faculties = 'select * from faculty';

    
    db.query(eventsQuery, (err, eventResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }

        db.query(facultiesQuery, (err, facultyResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }

                        res.render('admin', { events: eventResults, users: facultyResults });
        });
    });
};


exports.approveEvent = (req, res) => {
    const eventId = req.params.id;
    const query = 'UPDATE events SET status = "approved" WHERE id = ?';
    db.query(query, [eventId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.redirect('/admin/events');
    });
};

exports.disapprove = (req,res)=>{
    const eventId = req.params.id;
    const query = 'update events set status  = "pending" where id  = ?';
    db.query(query, [eventId],(err,result)=>{
        res.redirect('/admin/events');
    })
}

exports.reject = (req,res)=>{
    const eventID = req.params.id;
    const [reason] = req.body;
    const query = 'delete from events where id = ?';
    db.query(query, [eventId],(err,result)=>{
        res.redirect('/admin/events');
    })
}