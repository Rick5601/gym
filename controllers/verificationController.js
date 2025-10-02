const db = require('../config/db');

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Token is required');
    }

    try {
        // Find user with valid token
        const [user] = await db.query(
            'SELECT * FROM users WHERE verification_token = ? AND verification_expires > NOW()',
            [token]
        );

        if (user.length === 0) {
            return res.status(400).send('Invalid or expired token');
        }

        // Update user as verified and remove the token
        await db.query(
            'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE user_id = ?',
            [user[0].user_id]
        );

        // Redirect to payments page after successful verification
        return res.redirect('/payments.html');

    } catch (error) {
        console.error('Verification Error:', error);
        return res.status(500).send('Server error');
    }
};
