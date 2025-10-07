const db = require('../config/db');

// ===============================
// Get Login History with Pagination
// ===============================
exports.getLoginHistory = async (req, res) => {
    try {
        const userId = req.member.id; // from JWT
        const page = parseInt(req.query.page) || 1; // default page 1
        const limit = 5; // 5 records per page
        const offset = (page - 1) * limit;

        // Get the member_id for this user
        const [memberRows] = await db.query(
            'SELECT member_id, student_id FROM members WHERE user_id = ?',
            [userId]
        );

        if (memberRows.length === 0) {
            return res.json({ success: true, data: [], total: 0, totalPages: 0 });
        }

        const memberId = memberRows[0].member_id;

        // Get total records count
        const [countRows] = await db.query(
            'SELECT COUNT(*) as total FROM checkins WHERE member_id = ? AND is_archived = 0',
            [memberId]
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get paginated records
        const [rows] = await db.query(
            `SELECT m.student_id, u.username, 
                    c.checkin_time, c.checkout_time,
                    DATE(c.checkin_time) AS date
             FROM checkins c
             JOIN members m ON c.member_id = m.member_id
             JOIN users u ON m.user_id = u.user_id
             WHERE c.member_id = ? AND c.is_archived = 0
             ORDER BY c.checkin_time DESC
             LIMIT ? OFFSET ?`,
            [memberId, limit, offset]
        );

        res.json({ success: true, data: rows, total, totalPages });
    } catch (error) {
        console.error('Login History Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ===============================
// Check-In
// ===============================
exports.checkIn = async (req, res) => {
    try {
        const userId = req.member.id;

        const [memberRows] = await db.query('SELECT member_id FROM members WHERE user_id = ?', [userId]);
        if (memberRows.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });

        const memberId = memberRows[0].member_id;

        const [existing] = await db.query(
            'SELECT * FROM checkins WHERE member_id = ? AND checkout_time IS NULL AND is_archived = 0',
            [memberId]
        );

        if (existing.length > 0) return res.json({ success: false, message: 'You are already checked in.' });

        await db.query('INSERT INTO checkins (member_id, checkin_time, is_archived) VALUES (?, NOW(), 0)', [memberId]);

        res.json({ success: true, message: 'Checked in successfully!' });
    } catch (error) {
        console.error('Check-In Error:', error);
        res.status(500).json({ success: false, message: 'Server error during check-in.' });
    }
};

// ===============================
// Check-Out
// ===============================
exports.checkOut = async (req, res) => {
    try {
        const userId = req.member.id;

        const [memberRows] = await db.query('SELECT member_id FROM members WHERE user_id = ?', [userId]);
        if (memberRows.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });

        const memberId = memberRows[0].member_id;

        const [activeCheckin] = await db.query(
            'SELECT checkin_id FROM checkins WHERE member_id = ? AND checkout_time IS NULL AND is_archived = 0 ORDER BY checkin_time DESC LIMIT 1',
            [memberId]
        );

        if (activeCheckin.length === 0) return res.json({ success: false, message: 'No active check-in found.' });

        await db.query('UPDATE checkins SET checkout_time = NOW() WHERE checkin_id = ?', [activeCheckin[0].checkin_id]);

        res.json({ success: true, message: 'Checked out successfully!' });
    } catch (error) {
        console.error('Check-Out Error:', error);
        res.status(500).json({ success: false, message: 'Server error during check-out.' });
    }
};
