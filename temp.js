const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'node_modules')));


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Pavi@2005', 
  database: 'OnlineCourse'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id', connection.threadId);
});


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


app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    
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


pp.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  const sql = 'SELECT * FROM users WHERE username = ?';
  connection.query(sql, [trimmedUsername], async (err, results) => {
    if (err) {
      console.error('Error querying MySQL: ' + err.stack);
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

      
      res.redirect('/coursecatalog');
    } catch (err) {
      console.error('Error comparing passwords:', err);
      res.status(500).json({ error: 'Error during login' });
    }
  });
});



app.post('/courses/add', async (req, res) => {
  const { courseName, price, duration } = req.body;

  try {
    const insertSql = 'INSERT INTO courses (courseName, price, duration) VALUES (?, ?, ?)';
    connection.query(insertSql, [courseName, price, duration], (err, result) => {
      if (err) {
        console.error('Error adding course:', err);
        res.status(500).json({ error: 'Failed to add course' });
        return;
      }
      res.status(201).json({ message: 'Course added successfully' });
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ error: 'Failed to add course' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
