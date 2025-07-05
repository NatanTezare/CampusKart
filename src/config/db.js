// src/config/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Determine if we are in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Configuration object
const connectionConfig = {
    connectionString: process.env.DB_CONNECTION_STRING,
    // Add SSL for production connections, but not for local development
    ssl: isProduction ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(connectionConfig);

console.log('PostgreSQL Connection Pool Created.');

module.exports = {
    query: (text, params) => pool.query(text, params),
};