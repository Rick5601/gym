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

        const userId = user[0].user_id;

        // Update user as verified and remove the token
        await db.query(
            'UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE user_id = ?',
            [userId]
        );

        // Get payment option from members table
        const [member] = await db.query(
            'SELECT payment_option, student_id FROM members WHERE user_id = ?',
            [userId]
        );

        if (member.length === 0) {
            return res.status(400).send('Member record not found');
        }

        const paymentOption = member[0].payment_option;
        const studentId = member[0].student_id;

        // Redirect based on payment option
        if (paymentOption === 'now') {
            return res.redirect(`/payment.html?student_id=${studentId}`);
        } else {
            return res.redirect('/member_login.html');
        }

    } catch (error) {
        console.error('Verification Error:', error);
        return res.status(500).send('Server error');
    }
};
