const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'users',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' and 'templates' folders
app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'templates')));

// Serve static files from 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.set('view engine', 'ejs');

// Function to check for duplicate values
async function checkForDuplicate(prn, email) {
  return new Promise((resolve, reject) => {
    const checkDuplicateSql = 'SELECT * FROM users WHERE prn = ? OR email = ?';
    db.query(checkDuplicateSql, [prn, email], (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
      }

      // If any result is returned, it means there is a duplicate
      const isDuplicate = results.length > 0;
      resolve(isDuplicate);
    });
  });
}

// Route to fetch the user's name
app.get('/get-user-name', (req, res) => {
  const email = "example@gmail.com"; // Replace this with the email of the logged-in user (assuming you have access to the user's email)

  // Query the database to fetch the user's name based on their email
  const sql = 'SELECT name FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching user name. Please try again.');
    }

    if (results.length > 0) {
      const userName = results[0].name;
      res.send(userName); // Send the user's name as a response
    } else {
      res.status(404).send('User not found.'); // Handle the case where user is not found
    }
  });
});

// Routes
app.get('/practice', (req, res) => {
 res.render('practice')
});
// faculty
app.get('/faculty', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'faculty.html'))
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'signup.html'));
});
app.get('/practice1', (req, res) => {
 res.render('practice1')});
// Check for duplicate values endpoint
app.post('/check-duplicate', async (req, res) => {
  const { prn, email } = req.body;

  try {
    const isDuplicate = await checkForDuplicate(prn, email);
    res.json({ isDuplicate });
  } catch (error) {
    res.status(500).json({ isDuplicate: true });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { name, prn, email, password, category } = req.body;

  // Check if email matches the required format
  const emailRegex = /^(\d{10})@mitwpu\.edu\.in$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Please enter a valid email address in the format PRN@mitwpu.edu.in.');
  }

  // Check if PRN matches the email
  if (email.slice(0, 10) !== prn) {
    return res.status(400).send('The entered PRN does not match the email address.');
  }

  try {
    // Check for duplicate values
    const isDuplicate = await checkForDuplicate(prn, email);
    if (isDuplicate) {
      // Send an error response to the client
      return res.status(400).send('Credentials are already taken. Please choose another.');
    }

    // If not a duplicate and email format is valid, proceed with signup logic
    const signupSql = 'INSERT INTO users (name, prn, email, password, category) VALUES (?, ?, ?, ?, ?)';
    const loginSql = 'INSERT INTO login_users (username, password) VALUES (?, ?)';

    db.query(signupSql, [name, prn, email, password, category], (signupErr) => {
      if (signupErr) {
        console.error(signupErr);
        // Send an error response to the client
        return res.status(500).send('Error during signup. Please try again.');
      }

      // Insert into the login_users table if signup is successful
      db.query(loginSql, [email, password], (loginErr) => {
        if (loginErr) {
          console.error(loginErr);
          // Send an error response to the client
          return res.status(500).send('Error during signup. Please try again.');
        }

        res.redirect('/login'); // Redirect to the login page after successful signup
      });
    });
  } catch (error) {
    res.status(500).send('Error during signup. Please try again.');
  }
});

// Login endpoint
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});


// Login endpoint
app.post('/login', (req, res) => {
  const { uname, psw } = req.body;

  // Query the login_users table to check if the provided username and password match
  const sql = 'SELECT * FROM login_users WHERE username = ? AND password = ?';
  db.query(sql, [uname, psw], (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Error during login. Please try again.');
    }

    // Check if results contain a matching user
    if (results.length > 0) {
      const user = results[0];

      // Fetch the user's name and category based on the provided username
      const userInfoQuery = 'SELECT name, category,email FROM users WHERE email = ?';
      db.query(userInfoQuery, [uname], (userInfoErr, userInfoResults) => {
        if (userInfoErr) {
          console.error(userInfoErr);
          return res.send('Error during login. Please try again.');
        }

        // Check if results contain the user's name and category
        if (userInfoResults.length > 0) {
          const { name, category,email } = userInfoResults[0];

          // Redirect to the corresponding category page with the user's name as a query parameter
          switch (category) {
            case 'student':
              const fetchEventsSql = 'SELECT * FROM events';
              db.query(fetchEventsSql, (fetchEventsErr, events) => {
                if (fetchEventsErr) {
                  console.error(fetchEventsErr);
                  return res.send('Error fetching events. Please try again.');
                }

                // Render the student template with the user's name and events data
                res.render('practice', { userName: name,email: email, category: category, events: events });
              });
              break;
            case 'faculty':
              const fetchEventsSql1 = 'SELECT * FROM events';
              db.query(fetchEventsSql1, (fetchEventsErr, events) => {
                if (fetchEventsErr) {
                  console.error(fetchEventsErr);
                  return res.send('Error fetching events. Please try again.');
                }

                // Render the student template with the user's name and events data
                res.render('faculty', { userName: name,email: email, category: category, events: events });
              });
              break;
            case 'event_manager':
              res.redirect(`/event?name=${name}`);
              break;
            default:
              res.send('Invalid category.');
          }
        } else {
          res.send('User information not found.');
        }
      });
    } else {
      res.send('Invalid email or password.');
    }
  });
});

// Create the 'uploads' folder if it doesn't exist
const uploadsFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsFolder); // Specify the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});

const upload = multer({ storage: storage });

// Function to check for duplicate event names
async function checkForDuplicateEvent(eventName) {
  return new Promise((resolve, reject) => {
    const checkDuplicateSql = 'SELECT * FROM events WHERE name = ?';
    db.query(checkDuplicateSql, [eventName], (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
      }

      // If any result is returned, it means there is a duplicate
      const isDuplicate = results.length > 0;
      resolve(isDuplicate);
    });
  });
}

// Routes
app.get('/event', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'event_manager.html'));
});

// Check for duplicate event names endpoint
app.post('/event', upload.single('image'), async (req, res) => {
  const event = req.body;
  const imagePath = req.file ? req.file.filename : null;

  try {
    // Check for duplicate event names
    const isDuplicate = await checkForDuplicateEvent(event.name);
    if (isDuplicate) {
      return res.status(400).send('Event name is already taken. Please choose another.');
    }

    // If not a duplicate, proceed with event submission logic
    const eventSql = 'INSERT INTO events (name, date, location, description, image, link, type) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.query(
      eventSql,
      [event.name, event.date, event.location, event.description, imagePath, event.link, event.type],
      (eventErr) => {
        if (eventErr) {
          console.error(eventErr);
          return res.status(500).send('Error during event submission. Please try again.');
        }

        res.redirect('/event-success');
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during event submission. Please try again.');
  }
});

// Success page after event submission
app.get('/event-success', (req, res) => {
  res.send('Event submitted successfully!');
});

// Route to fetch events from the database and send as JSON
app.get('/get-events', (req, res) => {
  const fetchEventsSql = 'SELECT * FROM events';

  db.query(fetchEventsSql, (err, events) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching events. Please try again.' });
    }

    // Update image paths to use a relative path or URL accessible to clients
    const updatedEvents = events.map(event => {
      return {
        ...event,
        image: event.image ? `/uploads/${event.image}` : null,
      };
    });

    res.json(updatedEvents);
  });
});

// Route to serve the student page
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'practice.html'));
});


app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'register.html'));
});
// Assuming you have routes set up with Express
app.post('/register', (req, res) => {
  const { name, email, category, event_id, event_name } = req.body;

  // Insert registration details into the registrations table
  const insertRegistrationSql = 'INSERT INTO registrations (name, email, category, event_id, event_name) VALUES (?, ?, ?, ?, ?)';
  db.query(insertRegistrationSql, [name, email, category, event_id, event_name], (err, result) => {
      if (err) {
          console.error('Error registering for event:', err);
          return res.status(500).json({ success: false, message: 'Error registering for event. Please try again.' });
      }
      return res.status(200).json({ success: true, message: 'Registration successful.' });
  });
});



app.get('/users', (req, res) => {
  let sql = 'SELECT * FROM users ORDER BY category';
  db.query(sql, (err, results) => {
      if(err) throw err;
      res.render('users', { users: results });
  });
});



// showing events
app.get('/eventstable', (req, res) => {
  let sql = 'SELECT * FROM events';
  db.query(sql, (err, results) => {
      if(err) throw err;
      res.render('events', { events: results });
  });
});

// Route to handle event registration
app.post('/register-event', (req, res) => {
  // Retrieve registration information from the request body
  const userName = req.body.userName;
  const eventId = req.body.eventId;
  const eventName = req.body.eventName;

  // You can add confirmation logic here, for example:
  // If user confirms registration (assuming it's passed in the request body as 'confirmation')
  const confirmation = req.body.confirmation;
  if (confirmation === 'yes') {
      // Perform registration logic here (insert registration record into the database, etc.)
      // Once registration is successful, you can redirect the user or send a response
      res.send('Registration successful!');
  } else {
      // Handle if user declines registration
      res.send('Registration declined.');
  }
});
app.post('/dashboard', (req, res) => {
  // Assuming userEmail is available in the request body
  const userEmail = req.body.email;

  console.log('User email:', userEmail); // Log userEmail

  // Fetch user details from the database based on userEmail
  db.query('SELECT * FROM users WHERE email = ?', [userEmail], (err, userResults) => {
      if (err) {
          // Handle error
          console.error('Error fetching user details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      console.log('User details:', userResults); // Log userResults

      // Check if userResults is empty
      if (userResults.length === 0) {
          console.log('User not found'); // Log user not found
          res.status(404).send('User not found');
          return;
      }

      // Fetch registrations associated with the user
      db.query('SELECT * FROM registrations WHERE email = ?', [userEmail], (err, registrationResults) => {
          if (err) {
              // Handle error
              console.error('Error fetching registrations:', err);
              res.status(500).send('Internal Server Error');
              return;
          }

          // Render the dashboard.ejs template with user and registration data
          res.render('dashboard', { user: userResults[0], registrations: registrationResults });
      });
  });
});

// Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
