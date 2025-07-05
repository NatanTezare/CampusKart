const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const sendEmail = require('../utils/sendEmail');

const registerUser = async (req, res) => {
    const { firstName, lastName, usiuEmail, password } = req.body;

    if (!usiuEmail || !usiuEmail.toLowerCase().endsWith('@usiu.ac.ke')) {
        return res.status(400).json({ message: 'Registration is restricted to valid @usiu.ac.ke emails only.' });
    }
    if (!firstName || !lastName || !password) {
        return res.status(400).json({ message: 'Please include all fields' });
    }

    try {
        const { rows: existingUsers } = await db.query('SELECT * FROM users WHERE usiu_email = $1', [usiuEmail]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO users (first_name, last_name, usiu_email, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id';
        const { rows } = await db.query(sql, [firstName, lastName, usiuEmail, hashedPassword]);
        const newUserId = rows[0].user_id;

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000);

        await db.query('UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE user_id = $3', [verificationToken, tokenExpires, newUserId]);

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        const message = `<h1>Welcome to CampusKart!</h1><p>Please click the link below to verify your email. This link expires in 1 hour.</p><a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>`;

        await sendEmail({ email: usiuEmail, subject: 'CampusKart - Verify Your Email Address', message });

        res.status(201).json({ message: 'User registered successfully! Please check your email to verify your account.', userId: newUserId });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    const { usiuEmail, password } = req.body;
    if (!usiuEmail || !password) {
        return res.status(400).json({ message: 'Please provide an email and password' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE usiu_email = $1', [usiuEmail]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const payload = { id: user.user_id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Logged in successfully!',
            token,
            user: { id: user.user_id, firstName: user.first_name, email: user.usiu_email }
        });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const verifyUserEmail = async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()', [token]);
        const user = rows[0];
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }
        await db.query('UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE user_id = $1', [user.user_id]);
        res.status(200).send('<h1>Email successfully verified!</h1><p>You can now log in to your account.</p>');
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
};

module.exports = { registerUser, loginUser, verifyUserEmail };