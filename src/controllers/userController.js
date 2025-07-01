// src/controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const db = require('../config/db'); // Import the database pool
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { firstName, lastName, usiuEmail, password } = req.body;

        // --- NEW: VALIDATE THE EMAIL DOMAIN ---
    // Check if the email ends with the required domain
    if (!usiuEmail || !usiuEmail.toLowerCase().endsWith('@usiu.ac.ke')) {
        return res.status(400).json({ message: 'Registration is restricted to valid @usiu.ac.ke emails only.' });
    }

    if (!firstName || !lastName || !usiuEmail || !password) {
        return res.status(400).json({ message: 'Please include all fields' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT * FROM users WHERE usiu_email = ?', [usiuEmail]);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' }); // 409 Conflict
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert the new user into the database
        const sql = 'INSERT INTO users (first_name, last_name, usiu_email, password_hash) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [firstName, lastName, usiuEmail, hashedPassword]);

        // Generate a verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000); // Token expires in 1 hour

        // Save the token and its expiration date to the user's record
        await db.query(
        'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE user_id = ?',
        [verificationToken, tokenExpires, result.insertId]
        );

        // Log the verification URL to the console (development only)
        // Create verification URL
        const verificationUrl = `http://localhost:${process.env.PORT}/api/users/verify?token=${verificationToken}`;

        // Create the email message
        const message = `
            <h1>Welcome to CampusKart!</h1>
            <p>Thank you for registering. Please click the link below to verify your email address. This link will expire in 1 hour.</p>
            <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>`;


        // Send the email
        try {
            await sendEmail({
                email: usiuEmail, // The new user's email
                subject: 'CampusKart - Verify Your Email Address',
                message,
            });

        res.status(201).json({
            message: 'User registered successfully! Please check your email to verify your account.',
            userId: result.insertId,
        });
        } catch (error) {
            console.error('Email sending error:', error);
            // Important: If email fails, we should ideally roll back the user creation or have a resend mechanism.
            // For now, we'll return an error but the user is still in the DB.
            return res.status(500).json({ message: 'User registered, but email could not be sent.' });
            }

        // Respond with success
        res.status(201).json({
            message: 'User registered successfully!',
            userId: result.insertId,
            user: {
                firstName,
                lastName,
                usiuEmail
            }
        });

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};


// @desc    Authenticate a user and get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { usiuEmail, password } = req.body;

    if (!usiuEmail || !password) {
        return res.status(400).json({ message: 'Please provide an email and password' });
    }

    try {
        // 1. Find the user by email
        const [users] = await db.query('SELECT * FROM users WHERE usiu_email = ?', [usiuEmail]);
        const user = users[0];

        // If user doesn't exist, send a generic error message
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' }); // 401 Unauthorized
        }

        // Email verification check
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
         }

        // 2. Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        // If passwords don't match, send the same generic error
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. If everything is correct, create a JWT
        const payload = {
            id: user.user_id // The data we want to encode in the token
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 7 days
        );

        // 4. Send the token back to the client
        res.status(200).json({
            message: 'Logged in successfully!',
            token: token,
            user: {
                id: user.user_id,
                firstName: user.first_name,
                email: user.usiu_email
            }
        });

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Email verification function
const verifyUserEmail = async (req, res) => {
    const { token } = req.query; // Get token from query parameters

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
        // Find the user with the matching token that has not expired
        const [users] = await db.query(
            'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
            [token]
        );

        const user = users[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Update the user to be verified and remove the token
        await db.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE user_id = ?',
            [user.user_id]
        );

        // You could redirect them to a "verification successful" page on your frontend
        res.status(200).send('<h1>Email successfully verified!</h1><p>You can now log in to your account.</p>');

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

// Don't forget to export it!
module.exports = {
    registerUser,
    loginUser,
    verifyUserEmail // Add it here
};
