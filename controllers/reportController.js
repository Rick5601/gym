const db = require("../config/db");

// POST /api/reports
exports.submitReport = async (req, res) => {
    try {
        const { subject, description } = req.body;
        if (!subject || !description) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        const userId = req.member.id;
        await db.query(
            "INSERT INTO reports (submitted_by_user_id, subject, message, submitted_at) VALUES (?, ?, ?, NOW())",
            [userId, subject, description]
        );

        res.json({ success: true, message: "Report submitted successfully" });
    } catch (err) {
        console.error("Error submitting report:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET /api/reports?page=1
exports.getReports = async (req, res) => {
    try {
        const userId = req.member.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // number of reports per page
        const offset = (page - 1) * limit;

        // Get total count of reports
        const [countResult] = await db.query(
            "SELECT COUNT(*) as total FROM reports WHERE submitted_by_user_id = ?",
            [userId]
        );
        const total = countResult[0].total;

        // Fetch paginated reports
        const [rows] = await db.query(
            "SELECT report_id, subject, message, submitted_at FROM reports WHERE submitted_by_user_id = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?",
            [userId, limit, offset]
        );

        res.json({ success: true, reports: rows, total });
    } catch (err) {
        console.error("Error fetching reports:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
