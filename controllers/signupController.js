const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.registerMember = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            student_id,
            gender,
            phone_number,
            email_address,
            username,   // ✅ added username
            password,
            plan_name,
            price,
            duration_days
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !gender || !email_address || !username || !password || !plan_name || !price || !duration_days) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields' });
        }

        // Check if email or username already exists
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email_address, username]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or username already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users
        const [userResult] = await db.query(
            'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
            [username, email_address, hashedPassword, 'member']
        );
        const user_id = userResult.insertId;

        // Insert subscription
        const [subResult] = await db.query(
            'INSERT INTO subscriptions (plan_name, price, duration_days, is_archived, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())',
            [plan_name, price, duration_days]
        );
        const subscription_id = subResult.insertId;

        // Insert member
        await db.query(
            `INSERT INTO members 
            (user_id, first_name, last_name, student_id, email, gender, phone, subscription_id, status, DOR, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())`,
            [user_id, first_name, last_name, student_id, email_address, gender, phone_number, subscription_id]
        );

        return res.status(201).json({ success: true, message: 'Member registered successfully with subscription!' });

    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
