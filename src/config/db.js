// src/config/db.js
const mysql = require('mysql2/promise'); // Using the promise-based version
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool. A pool is better than a single connection for web apps
// as it manages multiple connections, which is more efficient.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('MySQL Connection Pool Created.');

module.exports = pool;