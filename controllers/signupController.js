const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { MailerSend, EmailParams } = require('mailersend');

// Initialize MailerSend
const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

exports.registerMember = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            student_id,
            gender,
            phone_number,
            email_address,
            username,
            password,
            plan_name,
            amount,
            duration_days,
            payment_option,
            room_number
        } = req.body;

        if (
            !first_name || !last_name || !gender || !email_address ||
            !username || !password || !plan_name || !amount ||
            !duration_days || !payment_option
        ) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields' });
        }

        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email_address, username]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or username already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        const [userResult] = await db.query(
            'INSERT INTO users (username, email, password, role, verification_token, verification_expires, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [username, email_address, hashedPassword, 'member', verificationToken, verificationExpires]
        );
        const user_id = userResult.insertId;

        const [subResult] = await db.query(
            'INSERT INTO subscriptions (plan_name, amount, duration_days, is_archived, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())',
            [plan_name, amount, duration_days]
        );
        const subscription_id = subResult.insertId;

        await db.query(
            `INSERT INTO members 
            (user_id, first_name, last_name, student_id, email, gender, phone, room_number, subscription_id, payment_option, status, DOR, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())`,
            [user_id, first_name, last_name, student_id, email_address, gender, phone_number, room_number || null, subscription_id, payment_option]
        );

        // ✅ Updated to use APP_URL
        const appURL = process.env.APP_URL || "http://localhost:5000";
        const verificationLink = `${appURL}/api/verify-email?token=${verificationToken}`;
        const emailParams = new EmailParams()
            .setFrom({ email: process.env.MAILERSEND_FROM_EMAIL, name: 'UNZA Gym' })
            .setTo([{ email: email_address, name: first_name }])
            .setSubject('Verify your UNZA Gym account')
            .setHtml(`
                <p>Hello ${first_name},</p>
                <p>Thank you for registering. Please verify your email by clicking the link below:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `);

        await mailerSend.email.send(emailParams);

        return res.status(201).json({
            success: true,
            message: 'Member registered successfully! Please check your email to verify your account.'
        });

    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
