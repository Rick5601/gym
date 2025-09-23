const db = require('../config/db');

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }

    try {
        // Find user with valid token
        const [user] = await db.query(
            'SELECT * FROM users WHERE verification_token = ? AND verification_expires > NOW()',
            [token]
        );

        if (user.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Update user as verified
        await db.query(
            'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?',
            [user[0].id]
        );

        return res.json({ success: true, message: 'Email verified successfully!' });

    } catch (error) {
        console.error('Verification Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
