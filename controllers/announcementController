const pool = require("../config/db");

// Get all announcements with pagination
exports.getAllAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;   // current page, default 1
    const limit = parseInt(req.query.limit) || 5; // announcements per page
    const offset = (page - 1) * limit;

    // Fetch announcements with limit & offset
    const [rows] = await pool.query(
      `SELECT a.announcement_id, a.title, a.message, a.created_at, a.is_archived, ad.full_name AS admin_name
       FROM announcements a
       LEFT JOIN admins ad ON a.admin_id = ad.admin_id
       WHERE a.visibility IN ('all','members')
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count of announcements for pagination
    const [[{ total = 0 }]] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM announcements 
       WHERE visibility IN ('all','members')`
    );

    const totalPages = Math.ceil(total / limit);

    res.json({ success: true, announcements: rows, totalPages });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, visibility } = req.body;

    if (!title || !message || !visibility) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Ensure JWT payload has user_id
    const user_id = req.admin?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: no user_id in token" });
    }

    // Find admin_id from user_id
    const [rows] = await pool.query("SELECT admin_id FROM admins WHERE user_id = ?", [user_id]);
    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: "Not an admin" });
    }
    const admin_id = rows[0].admin_id;

    await pool.query(
      `INSERT INTO announcements (admin_id, title, message, visibility, is_archived, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [admin_id, title, message, visibility]
    );

    res.json({ success: true, message: "Announcement created successfully" });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Archive / Unarchive an announcement
exports.toggleArchiveAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive } = req.body;

    if (archive === undefined) {
      return res.status(400).json({ success: false, message: "Archive status is required" });
    }

    await pool.query(
      "UPDATE announcements SET is_archived = ? WHERE announcement_id = ?",
      [archive ? 1 : 0, id]
    );

    res.json({ success: true, message: `Announcement ${archive ? "archived" : "unarchived"} successfully` });
  } catch (err) {
    console.error("Error updating announcement archive status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
