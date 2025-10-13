// controllers/removeMembersController.js
const pool = require("../config/db");

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
         await pool.query("UPDATE members SET status = 'inactive' WHERE user_id = ?", [user_id]);

        res.json({ success: true, message: "Member marked as inactive (soft-deleted). Subscriptions and payment history remain intact." });
    } catch (err) {
        console.error("Error soft-deleting member:", err);
        res.status(500).json({ success: false, error: "Server error while removing member" });
    }
};
