const express = require('express');
const otpController = require('../Controllers/otpController');
const router = express.Router();

router.post('/send', otpController.sendOtp);
router.post('/verify', otpController.verifyOtp);


// router.get('/verify', (req, res) => {
//     res.render('verify-otp'); // Render OTP verification page (make sure this file exists)
// });
module.exports = router;
