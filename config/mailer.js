const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'aryansharm3876@gmail.com',
        pass: 'ddccgvssyfeofrls'
    }
});

module.exports = transporter;
