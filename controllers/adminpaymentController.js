const pool = require("../config/db");

// ======================================================
// Get Payment Proof (Admin view) — optimized in portions
// ======================================================
exports.getPaymentProof = async (req, res) => {
  console.log(`[${new Date().toISOString()}] getPaymentProof called`);

  try {
    let userId;

    // Admin access only
    if (req.admin) {
      userId = req.query.user_id || req.params.user_id;
      if (!userId) {
        const response = { success: false, message: "User ID required for admin" };
        console.log(`[${new Date().toISOString()}] Response:`, response);
        return res.status(400).json(response);
      }
    } else {
      const unauthorized = { success: false, message: "Unauthorized: Admin access required" };
      console.log(`[${new Date().toISOString()}] Response:`, unauthorized);
      return res.status(403).json(unauthorized);
    }

    console.log(`[${new Date().toISOString()}] Fetching payment proof for userId: ${userId}`);

    // --- 1️⃣ Fetch user info ---
    const [userRows] = await pool.query(
      `SELECT user_id, username, email, gender, role, status AS account_status
       FROM users WHERE user_id = ?`,
      [userId]
    );
    if (!userRows.length) {
      const response = { success: false, message: "User not found." };
      console.log(`[${new Date().toISOString()}] Response:`, response);
      return res.json(response);
    }
    const user = userRows[0];
    console.log(`[${new Date().toISOString()}] ✅ User info fetched`);

    // --- 2️⃣ Fetch member info ---
    const [memberRows] = await pool.query(
      `SELECT first_name, last_name, student_id, phone, payment_option, subscription_id
       FROM members WHERE user_id = ?`,
      [userId]
    );
    const member = memberRows[0] || {};
    console.log(`[${new Date().toISOString()}] ✅ Member info fetched`);

    // --- 3️⃣ Fetch subscription info ---
    let subscription = {};
    if (member.subscription_id) {
      const [subRows] = await pool.query(
        `SELECT plan_name, amount AS plan_amount, duration_days
         FROM subscriptions WHERE subscription_id = ?`,
        [member.subscription_id]
      );
      subscription = subRows[0] || {};
      console.log(`[${new Date().toISOString()}] ✅ Subscription info fetched`);
    }

    // --- 4️⃣ Fetch latest payment info ---
    const [paymentRows] = await pool.query(
      `SELECT id AS payment_id, amount AS payment_amount, payment_method, details,
              status AS payment_status, payment_proof, created_at AS payment_date
       FROM payments
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    const payment = paymentRows[0] || {};
    console.log(`[${new Date().toISOString()}] ✅ Payment info fetched`);

    // --- Combine all sections ---
    const response = {
      success: true,
      payment: {
        user_id: user.user_id,
        username: user.username ?? null,
        email: user.email ?? null,
        gender: user.gender ?? null,
        role: user.role ?? null,
        account_status: user.account_status ?? null,
        first_name: member.first_name ?? null,
        last_name: member.last_name ?? null,
        student_id: member.student_id ?? null,
        phone: member.phone ?? null,
        payment_option: member.payment_option ?? null,
        plan_name: subscription.plan_name ?? null,
        plan_amount: subscription.plan_amount ?? null,
        duration_days: subscription.duration_days ?? null,
        payment_id: payment.payment_id ?? null,
        payment_amount: payment.payment_amount ?? null,
        payment_method: payment.payment_method ?? null,
        details: payment.details ?? null,
        payment_status: payment.payment_status ?? null,
        payment_proof: payment.payment_proof ?? null,
        payment_date: payment.payment_date ?? null,
      },
    };

    console.log(`[${new Date().toISOString()}] ✅ Response ready`, response);
    res.json(response);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching payment proof:`, err);
    const errorResponse = { success: false, message: "Server error fetching payment proof" };
    res.status(500).json(errorResponse);
  }
};

// ======================================================
// Approve Payment (Admin)
// ======================================================
exports.approvePayment = async (req, res) => {
  console.log(`[${new Date().toISOString()}] approvePayment called`);

  try {
    const userId = req.params.user_id;
    if (!userId) {
      const response = { success: false, message: "User ID required" };
      return res.status(400).json(response);
    }

    console.log(`[${new Date().toISOString()}] Approving payment for userId: ${userId}`);

    const [paymentResult] = await pool.query(
      `UPDATE payments SET status = 'confirmed' WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );

    if (!paymentResult.affectedRows) {
      const response = { success: false, message: "No pending payment found." };
      return res.json(response);
    }

    // Activate user and member
    await pool.query(`UPDATE users SET status = 'active' WHERE user_id = ?`, [userId]);
    await pool.query(`UPDATE members SET status = 'active' WHERE user_id = ?`, [userId]);

    const response = { success: true, message: "Payment approved and user activated." };
    console.log(`[${new Date().toISOString()}] ✅ Response:`, response);
    res.json(response);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error approving payment:`, err);
    res.status(500).json({ success: false, message: "Server error approving payment" });
  }
};

// ======================================================
// Reject Payment (Admin)
// ======================================================
exports.rejectPayment = async (req, res) => {
  console.log(`[${new Date().toISOString()}] rejectPayment called`);

  try {
    const userId = req.params.user_id;
    if (!userId) {
      const response = { success: false, message: "User ID required" };
      return res.status(400).json(response);
    }

    console.log(`[${new Date().toISOString()}] Rejecting payment for userId: ${userId}`);

    const [paymentResult] = await pool.query(
      `UPDATE payments SET status = 'rejected' WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );

    if (!paymentResult.affectedRows) {
      const response = { success: false, message: "No pending payment found." };
      return res.json(response);
    }

    // Deactivate user and member
    await pool.query(`UPDATE users SET status = 'inactive' WHERE user_id = ?`, [userId]);
    await pool.query(`UPDATE members SET status = 'inactive' WHERE user_id = ?`, [userId]);

    const response = { success: true, message: "Payment rejected and user deactivated." };
    console.log(`[${new Date().toISOString()}] ✅ Response:`, response);
    res.json(response);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error rejecting payment:`, err);
    res.status(500).json({ success: false, message: "Server error rejecting payment" });
  }
};
