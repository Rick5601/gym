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
        if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password' });

        // Member status checks
        if (user.role === 'member') {
            if (user.status === 'pending') return res.redirect('/pending.html');
            if (user.status === 'rejected') return res.redirect('/rejected.html');
            if (user.status !== 'active') return res.redirect('/invalid.html');
        }

        // Generate JWT
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
