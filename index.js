// Import the necessary packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors
const userRoutes = require('./src/routes/userRoutes'); // Import the user routes
const itemRoutes = require('./src/routes/itemRoutes'); // Import the item routes


// Load environment variables from .env file
dotenv.config();

// Initialize the express app
const app = express();

// Define the port from environment variables, or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
// This is crucial for your POST requests to work
app.use(cors()); // Use cors middleware
app.use(express.json());

// Use the user routes for any request to /api/users
app.use('/api/users', userRoutes);

app.use('/api/items', itemRoutes);

// Create a simple test route to make sure the server is working
app.get('/', (req, res) => {
  res.send('Hello, CampusKart Backend!');
});

// Start the server and make it listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
