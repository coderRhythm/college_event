const mysql = require('mysql2');
// const app = express();
// app.use(express.json()); // Needed to parse JSON bodies in POST/PUT requests

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'event_management',
  });

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database.');
    }
});

module.exports = db;
