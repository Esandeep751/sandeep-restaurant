const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection Config
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Replace with your MySQL username
    password: '',      // Replace with your MySQL password
    database: 'sandeep_restaurant'
});

db.connect(err => {
    if (err) throw err;
    console.log('Successfully connected to MySQL database.');
});

// --- AUTHENTICATION ROUTES ---
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    const query = 'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, phone, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer registered successfully', customer_id: result.insertId });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM customers WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ message: 'Login successful', customer: results[0] });
    });
});

// --- TABLE & RESERVATION ROUTES ---
app.get('/api/tables', (req, res) => {
    const query = 'SELECT * FROM tables WHERE status = "Available"';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/reservations', (req, res) => {
    const { customer_id, table_id, reservation_date, reservation_time, guests } = req.body;
    const insertQuery = 'INSERT INTO reservations (customer_id, table_id, reservation_date, reservation_time, guests, status) VALUES (?, ?, ?, ?, ?, "Confirmed")';
    
    db.query(insertQuery, [customer_id, table_id, reservation_date, reservation_time, guests], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE tables SET status = "Reserved" WHERE table_id = ?', [table_id]);
        res.json({ message: 'Reservation booked successfully', reservation_id: result.insertId });
    });
});

// --- STAFF MANAGEMENT ROUTES ---
app.get('/api/staff/reservations', (req, res) => {
    const query = `
        SELECT r.reservation_id, c.name AS customer_name, c.phone, t.table_number, 
               r.reservation_date, r.reservation_time, r.guests, r.status
        FROM reservations r
        JOIN customers c ON r.customer_id = c.customer_id
        JOIN tables t ON r.table_id = t.table_id
        ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.put('/api/staff/reservations/:id', (req, res) => {
    const { status } = req.body;
    const reservationId = req.params.id;
    const query = 'UPDATE reservations SET status = ? WHERE reservation_id = ?';
    db.query(query, [status, reservationId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Reservation status updated successfully' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});