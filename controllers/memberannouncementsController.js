const pool = require("../config/db");

exports.getAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Count only visible announcements
        const [[{ total = 0 }]] = await pool.query(
            `SELECT COUNT(*) AS total 
             FROM announcements a
             JOIN admins ad ON ad.admin_id = a.admin_id
             WHERE a.visibility IN ('all','members')`
        );

        const totalPages = Math.ceil(total / limit);

        // Prevent requesting pages beyond totalPages
        const currentPage = Math.min(page, totalPages) || 1;
        const newOffset = (currentPage - 1) * limit;

        const [rows] = await pool.query(
            `SELECT ad.full_name, a.announcement_id, a.title, a.message, a.created_at, a.is_archived
             FROM announcements a
             JOIN admins ad ON ad.admin_id = a.admin_id
             WHERE a.visibility IN ('all','members')
             ORDER BY a.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, newOffset]
        );

        res.json({ success: true, announcements: rows, totalPages });
    } catch (err) {
        console.error("Error fetching announcements:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
