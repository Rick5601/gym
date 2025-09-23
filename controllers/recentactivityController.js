// controllers/recentActivityController.js
const pool = require("../config/db");

exports.getRecentActivity = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.activity, a.created_at, a.member_id, m.first_name, m.last_name
       FROM activities a
       LEFT JOIN members m ON a.member_id = m.member_id
       ORDER BY a.created_at DESC
       LIMIT 5`
    );

    const formatted = rows.map((r) => ({
      activity: r.member_id
        ? `${r.first_name} ${r.last_name}: ${r.activity}`
        : r.activity,
      created_at: r.created_at,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("Error fetching recent activity:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
