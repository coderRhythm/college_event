const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminControllers');
// const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
// Route to get all events (approved and pending)
router.get('/events', adminController.getEvents);

// Route to approve an event
router.post('/events/approve/:id', adminController.approveEvent);
router.post('/events/disapprove/:id', adminController.disapprove);
router.post('/events/reject/:id', adminController.reject);
router.get('/events/assign', adminController.assignFaculty);
// router.post('/events/edit/:id', adminController.updateEventDates);
module.exports = router;
