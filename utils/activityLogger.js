// utils/activityLogger.js
const pool = require("../config/db");

async function logActivity(memberId, activity) {
  try {
    await pool.query(
      "INSERT INTO activities (member_id, activity) VALUES (?, ?)",
      [memberId, activity]
    );
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

module.exports = logActivity;
