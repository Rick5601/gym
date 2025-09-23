const db = require('../config/db'); // MySQL pool
console.log("Member controller loaded");

exports.getProfile = async (req, res) => {
  console.log(`[${new Date().toISOString()}] getProfile called`);

  try {
    // ✅ Authentication check
    if (!req.member || !req.member.id) {
      const unauthorizedResponse = { success: false, message: "Unauthorized: Invalid member token" };
      console.log(`[${new Date().toISOString()}] Response to frontend:`, unauthorizedResponse);
      return res.status(401).json(unauthorizedResponse);
    }

    const userId = req.member.id;
    console.log(`[${new Date().toISOString()}] Fetching profile for userId: ${userId}`);

    // ✅ Fetch member + subscription info
    const [memberRows] = await db.query(
  `SELECT 
      u.user_id,
      u.username,
      u.email,
      m.member_id,
      CONCAT(m.first_name, ' ', m.last_name) AS full_name,  -- ✅ dynamically create full_name
      m.first_name,
      m.last_name,
      m.student_id,
      m.gender,
      m.DOR,
      m.phone AS phone_number,
      m.room_number,
      s.plan_name AS subscription_type
   FROM users u
   JOIN members m ON u.user_id = m.user_id
   LEFT JOIN subscriptions s ON m.subscription_id = s.subscription_id
   WHERE u.user_id = ?`,
  [userId]
);



    // ✅ Handle missing member record
    if (!memberRows || memberRows.length === 0) {
      const notFoundResponse = { success: false, message: "Member not found" };
      console.log(`[${new Date().toISOString()}] Response to frontend:`, notFoundResponse);
      return res.status(404).json(notFoundResponse);
    }

    // ✅ Response data
    const responseData = { success: true, user: memberRows[0] };
    console.log(`[${new Date().toISOString()}] Response to frontend:`, responseData);
    res.json(responseData);

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching member profile:`, err);
    const errorResponse = { success: false, message: "Server error fetching profile" };
    console.log(`[${new Date().toISOString()}] Response to frontend:`, errorResponse);
    res.status(500).json(errorResponse);
  }
};
