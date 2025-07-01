// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, loginUser, verifyUserEmail } = require('../controllers/userController'); // Add verifyUserEmail

// When a POST request is made to '/register', execute the registerUser function
router.post('/register', registerUser);

// When a POST request is made to '/login', execute the loginUser function
router.post('/login', loginUser); // Add this new route

// Add the new verification route
router.get('/verify', verifyUserEmail);

module.exports = router;

