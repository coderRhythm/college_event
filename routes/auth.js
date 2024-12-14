const express = require('express');
const authController = require('../Controllers/authController');
const router = express.Router();

router.get('/signup', authController.showSignupPage);



module.exports = router;