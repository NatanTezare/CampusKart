// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Get user from the database using the id from the token
            // We select everything except the password hash for security
            const [users] = await db.query('SELECT user_id, first_name, last_name, usiu_email, is_verified FROM users WHERE user_id = ?', [decoded.id]);

            if (!users[0]) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // 4. Attach the user object to the request
            req.user = users[0];

            // 5. Proceed to the next function (the controller)
            next();

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };