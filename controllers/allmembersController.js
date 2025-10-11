// controllers/allMembersController.js
const pool = require("../config/db");

// Get all members (active users only)
exports.getAllMembers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
          m.member_id,
          u.user_id,  -- ✅ include user_id here
          u.username,
          CONCAT(m.first_name, ' ', m.last_name) AS full_name,
          m.first_name,
          m.last_name,
          m.student_id,
          m.gender,
          m.phone,
          m.email,
          m.DOR,
          m.room_number,
          s.amount,
          s.plan_name
      FROM members m
      JOIN users u ON m.user_id = u.user_id
      LEFT JOIN subscriptions s ON m.subscription_id = s.subscription_id
      WHERE u.status = 'active'
      ORDER BY m.DOR DESC
    `);

    res.json({ success: true, members: rows });
  } catch (err) {
    console.error("Error fetching active members:", err);
    res.status(500).json({ success: false, error: "Server error while fetching active members" });
  }
};
