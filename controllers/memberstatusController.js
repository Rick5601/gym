// controllers/memberStatusController.js
const pool = require("../config/db");

// Get all members with their status
exports.getMemberStatus = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          m.member_id,
          u.username,
          u.status,
          CONCAT(m.first_name, ' ', m.last_name) AS full_name,
          m.student_id,
          m.gender,
          m.phone,
          m.email,
          s.plan_name
      FROM members m
      JOIN users u ON m.user_id = u.user_id
      LEFT JOIN subscriptions s ON m.subscription_id = s.subscription_id
      ORDER BY m.DOR DESC
    `);

    console.log("Member status data:", rows);

    res.json({ success: true, members: rows });
  } catch (err) {
    console.error("Error fetching member status:", err);
    res.status(500).json({ success: false, error: "Server error while fetching member status" });
  }
};
