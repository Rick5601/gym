const pool = require("../config/db");

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ad.full_name, a.announcement_id, a.title, a.message, a.created_at, a.is_archived
       FROM announcements a
       JOIN admins ad ON ad.admin_id = a.admin_id
       ORDER BY a.created_at DESC`
    );

    res.json({ success: true, announcements: rows });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
