// controllers/pendingMembersController.js
const pool = require("../config/db");

// Get all pending members
exports.getPendingMembers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT m.member_id,
                    u.username,
                    CONCAT(m.first_name, ' ', m.last_name) AS full_name,
                    m.student_id,
                    m.gender,
                    m.phone AS phone_number,
                    m.email,
                    m.DOR,
                    m.room_number,
                    s.amount,
                    s.plan_name AS plan,
                    s.duration_days AS service
             FROM members m
             JOIN users u ON m.user_id = u.user_id
             LEFT JOIN subscriptions s ON m.subscription_id = s.subscription_id
             WHERE u.status = 'pending'
             ORDER BY m.DOR DESC`
        );

        res.json({ success: true, pendingMembers: rows });
    } catch (err) {
        console.error("Error fetching pending members:", err);
        res.status(500).json({ success: false, error: "Server error while fetching pending members" });
    }
};

// Approve a member
exports.approveMember = async (req, res) => {
    const { username } = req.params;

    try {
        // 1. Get member info and subscription duration
        const [memberRows] = await pool.query(
            `SELECT m.member_id, m.subscription_id, s.duration_days
             FROM members m
             JOIN subscriptions s ON m.subscription_id = s.subscription_id
             JOIN users u ON m.user_id = u.user_id
             WHERE u.username = ?`,
            [username]
        );

        if (memberRows.length === 0) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        const member = memberRows[0];

        // 2. Calculate start and end dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + member.duration_days);

        // 3. Update both users and members tables
        await pool.query(
            `UPDATE members m
             JOIN users u ON m.user_id = u.user_id
             SET u.status = 'active',
                 m.status = 'active',
                 m.start_date = ?,
                 m.end_date = ?
             WHERE u.username = ?`,
            [startDate, endDate, username]
        );

        res.json({ success: true, message: "Member approved successfully" });
    } catch (err) {
        console.error("Error approving member:", err);
        res.status(500).json({ success: false, error: "Server error while approving member" });
    }
};
