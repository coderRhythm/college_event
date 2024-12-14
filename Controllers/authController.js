const path = require('path');

exports.showSignupPage = (req, res) => {

     // Ensure req.session is defined
     if (!req.session) {
        req.session = {}; // Initialize if undefined
    }

  
        const filePath = path.join(__dirname, '../templates/enter-email.html');
        console.log('Serving file from:', filePath);
        
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(err.status).end();
            }
        });   

};

