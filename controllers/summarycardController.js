const pool = require("../config/db");

// Get summary card data
exports.getSummaryData = async (req, res) => {
  try {
    const [[{ totalMembers }]] = await pool.query(
      "SELECT COUNT(*) AS totalMembers FROM members WHERE status = 'active'"
    );

    const [[{ activeMembers }]] = await pool.query(
      "SELECT COUNT(*) AS activeMembers FROM members WHERE status = 'active'"
    );

    const [[{ pendingMembers }]] = await pool.query(
      "SELECT COUNT(*) AS pendingMembers FROM members WHERE status = 'pending'"
    );

    const [[{ totalSubscriptions }]] = await pool.query(
      "SELECT COUNT(*) AS totalSubscriptions FROM subscriptions"
    );

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        pendingMembers,
        totalSubscriptions,
      },
    });
  } catch (err) {
    console.error("Error fetching summary data:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
