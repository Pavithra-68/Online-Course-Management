const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'node_modules'))); // Updated to serve static files

// MySQL Connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Pavi@2005', // Replace with your MySQL password
  database: 'OnlineCourse'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id', connection.threadId);
});

// Route to check if username exists
app.get('/users/check/:username', async (req, res) => {
  const { username } = req.params;

  const sql = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
  connection.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Error querying MySQL:', err);
      res.status(500).json({ error: 'Error querying database' });
      return;
    }

    const count = results[0].count;

    if (count > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  });
});

// Route to handle user registration
app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if username already exists
    const checkSql = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
    connection.query(checkSql, [username], async (err, results) => {
      if (err) {
        console.error('Error checking username:', err);
        res.status(500).json({ error: 'Error registering user' });
        return;
      }

      const count = results[0].count;
      if (count > 0) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }

      // If username does not exist, proceed with registration
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
      connection.query(insertSql, [username, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error inserting user:', err);
          res.status(500).json({ error: 'Error registering user' });
          return;
        }
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Route to handle user login
app.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  const sql = 'SELECT * FROM users WHERE username = ?';
  connection.query(sql, [trimmedUsername], async (err, results) => {
    if (err) {
      console.error('Error querying MySQL:', err.stack);
      res.status(500).json({ error: 'Error querying database' });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const storedHashedPassword = results[0].password;

    try {
      const passwordMatch = await bcrypt.compare(trimmedPassword, storedHashedPassword);

      if (!passwordMatch) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      res.status(200).json({ message: 'Login successful' });
    } catch (err) {
      console.error('Error comparing passwords:', err);
      res.status(500).json({ error: 'Error during login' });
    }
  });
});

// Route to handle adding a new course
app.post('/courses/add', async (req, res) => {
  const { courseName, price, duration, courseDetailPage } = req.body;
  const query = 'INSERT INTO courses (courseName, price, duration, courseDetailPage) VALUES (?, ?, ?, ?)';
  
  connection.query(query, [courseName, price, duration, courseDetailPage], (error, results) => {
    if (error) {
      console.error('Error inserting course:', error);
      res.status(500).json({ error: 'Failed to add course' });
      return;
    }
    res.status(200).json({ message: 'Course added successfully' });
  });
});

// Route to retrieve all courses
app.get('/courses', (req, res) => {
  const selectSql = 'SELECT * FROM courses';
  connection.query(selectSql, (err, results) => {
    if (err) {
      console.error('Error retrieving courses:', err);
      res.status(500).json({ error: 'Failed to retrieve courses' });
      return;
    }
    res.status(200).json(results);
  });
});

// Enroll in a course
app.post('/enroll', (req, res) => {
  const { courseName, userId } = req.body;
  const sql = 'INSERT INTO enrollments (userId, courseName) VALUES (?, ?)';
  connection.query(sql, [userId, courseName], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'Course enrolled successfully' });
  });
});

// Get enrolled courses
app.get('/enrolled-courses', (req, res) => {
  const userId = req.query.userId;
  const sql = 'SELECT courseName FROM enrollments WHERE userId = ?';
  connection.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
