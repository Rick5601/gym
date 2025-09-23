const db = require('../config/db');

exports.getLoginHistory = async (req, res) => {
    try {
        const userId = req.member.id; // this is from JWT (user_id)
        
        // Get the member_id for this user
        const [memberRows] = await db.query(
            'SELECT member_id, student_id FROM members WHERE user_id = ?',
            [userId]
        );

        if (memberRows.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const memberId = memberRows[0].member_id;

        const [rows] = await db.query(
            `SELECT m.student_id, u.username, 
                    c.checkin_time, c.checkout_time,
                    DATE(c.checkin_time) AS date
             FROM checkins c
             JOIN members m ON c.member_id = m.member_id
             JOIN users u ON m.user_id = u.user_id
             WHERE c.member_id = ? AND c.is_archived = 0
             ORDER BY c.checkin_time DESC`,
            [memberId]
        );

        res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Login History Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
