const transporter = require('../config/mailer');
const otps = {}; // In-memory OTP storage for demonstration. Use a database in production.
const path = require('path'); // Import the path module
const db = require('../db'); // Assuming you have a db.js for database connection


exports.sendOtp = (req, res) => {
    if (!req.session) {
        req.session = {}; // Initialize session if undefined
    }
    
    const { email } = req.body;
    if (!email) {
        return res.status(400).send('Email is required');
    }
    
    // Check if email already exists in the database
    const checkEmailQuery = 'SELECT * FROM login_users WHERE username = ?';
    db.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        // If email exists in the database, send an alert response
        if (results.length > 0) {
            return res.send(`
                <script>
                    alert('Username already present. Please log in.');
                    window.location.href = '/login'; // Redirect to login page
                </script>
            `);
        }

        // If email is not in the database, proceed to send OTP
        req.session.email = email; // Store email in session

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps[email] = otp;

        transporter.sendMail({
            from: 'aryansharm3876@gmail.com',
            to: email,
            subject: 'Your OTP',
            text: `Your OTP is: ${otp}`
        }, (err, info) => {
            if (err) {
                console.error('Error sending OTP email:', err);
                return res.status(500).send('Error sending OTP');
            }
            console.log('OTP sent:', info.response);

            res.render('verify-otp', { email, errorMessage: null}); // Pass email to the template
        });
    });
};

// exports.verifyOtp = (req, res) => {
//     console.log('Session after setting email:', req.session);
    

//     const { otp } = req.body;
//     console.log("otp is ", otp);
//     const email = req.session?.email;
//     console.log("email otp",otps[email])

//     console.log('Session after accessing email:', req.session);



//     if (!email) {
//         return res.status(400).send('No email found in session. Please request an OTP first.');
//     }
//     console.log('Session after setting email:', req.session);

//     console.log("email otp",otps[email])


//     if (otps[email] === otp) {
//         delete otps[email];
//         req.session.isLoggedIn = true;
//         console.log('after is logged in true', req.session.isLoggedIn);

//         res.redirect('/signup-form');
//     } else {
//         res.send('Incorrect OTP. <a href="/otp/verify">Try again</a>');
//     }
// };


exports.verifyOtp = (req, res) => {
    const { otp } = req.body;
    const email = req.session?.email;

    // Check if email is in session
    if (!email) {
        return res.status(400).send('No email found in session. Please request an OTP first.');
    }

    // Check if OTP matches
    if (otps[email] === otp) {
        // OTP is correct, proceed to next page
        delete otps[email]; // Clear OTP after successful verification
        req.session.isLoggedIn = true;
        res.redirect('/signup-form'); // Redirect to the signup page
    } else {
        // OTP is incorrect, show error on the same page
        const errorMessage = "Incorrect OTP. Please try again.";
        res.render('verify-otp', { email, errorMessage: 'Invalid OTP. Please try again.' }); // Pass error message to the view
    }
};
