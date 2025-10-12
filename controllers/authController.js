const db = require('../config/db'); // MySQL pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
        return res.status(400).json({ success: false, message: 'Please provide username/email and password' });
    }

    try {
        let query = '';
        let params = [];

        if (username) {
            query = 'SELECT * FROM users WHERE username = ?';
            params = [username];
        } else {
            query = 'SELECT * FROM users WHERE email = ?';
            params = [email];
        }

        const [results] = await db.query(query, params);

        if (!results || results.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: 'Incorrect password' });

        // -------------------- MEMBER STATUS CHECKS --------------------
        if (user.role === 'member') {
            // Check recent payments for this user
            const [paymentResults] = await db.query(
                'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
                [user.user_id]
            );

            const recentPayment = paymentResults && paymentResults.length > 0 ? paymentResults[0] : null;

            if (user.status === 'pending') {
                // If user has no payment record, send to make_payment.html
                if (!recentPayment) {
                    return res.json({ success: false, redirect: '/make_payment.html' });
                }
                // If payment exists, redirect to normal pending page
                return res.json({ success: false, redirect: '/pending.html' });
            }

            if (user.status === 'rejected') {
                return res.json({ success: false, redirect: '/rejected.html' });
            }

            if (user.status !== 'active') {
                return res.json({ success: false, redirect: '/invalid.html' });
            }
        }

        // -------------------- GENERATE JWT --------------------
        const token = jwt.sign(
            {
                id: user.user_id,
                role: user.role,
                full_name: user.full_name || user.username,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.user_id,
                full_name: user.full_name || user.username,
                username: user.username,
                role: user.role
            },
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error', error: err.message || err });
    }
};

// -------------------- DASHBOARDS --------------------
exports.adminDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin_pages/admin_dashboard.html'));
};

exports.memberDashboard = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/member_pages/profile.html'));
};

// -------------------- LOGOUT --------------------
exports.logout = (req, res) => {
    res.json({ success: true, message: 'Logged out' });
};
