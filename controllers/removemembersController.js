// controllers/removeMembersController.js
const pool = require("../config/db");

// Get all members (for removal page)
exports.getAllMembers = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT m.member_id,
                    u.user_id,
                    u.username,
                    CONCAT(m.first_name, ' ', m.last_name) AS full_name,
                    m.student_id,
                    m.gender,
                    m.phone AS phone_number,
                    m.email,
                    m.DOR AS date_registered,
                    IFNULL(s.plan_name, 'No Plan') AS plan
             FROM members m
             JOIN users u ON m.user_id = u.user_id
             LEFT JOIN subscriptions s ON m.subscription_id = s.subscription_id
             WHERE u.status = 'active'
             ORDER BY m.DOR DESC`
        );

        res.json({ success: true, members: rows });
    } catch (err) {
        console.error("Error fetching members:", err);
        res.status(500).json({ success: false, error: "Server error while fetching members" });
    }
};

// Soft-delete a member (mark as inactive)
exports.removeMember = async (req, res) => {
    const { user_id } = req.params;

    try {
        // Check if member exists
        const [memberRows] = await pool.query("SELECT * FROM members WHERE user_id = ?", [user_id]);
        if (memberRows.length === 0) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        // Soft-delete: mark the user as inactive
        await pool.query("UPDATE users SET status = 'inactive' WHERE user_id = ?", [user_id]);

        res.json({ success: true, message: "Member marked as inactive (soft-deleted). Subscriptions and payment history remain intact." });
    } catch (err) {
        console.error("Error soft-deleting member:", err);
        res.status(500).json({ success: false, error: "Server error while removing member" });
    }
};
