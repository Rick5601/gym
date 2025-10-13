const pool = require("../config/db");
const { MailerSend, EmailParams } = require("mailersend");

// Initialize MailerSend
const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

// ========================== Helper: send email ==========================
async function sendEmail(to, subject, html) {
    const emailParams = new EmailParams()
        .setFrom({ email: process.env.MAILERSEND_FROM_EMAIL, name: "UNZA Gym" })
        .setTo([{ email: to }])
        .setSubject(subject)
        .setHtml(html);

    await mailerSend.email.send(emailParams);
}

// ======================= Get Payment Proof =======================
exports.getPaymentProof = async (req, res) => {
    try {
        if (!req.admin) return res.status(403).json({ success: false, message: "Unauthorized" });

        const userId = req.query.user_id || req.params.user_id;
        if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

        // Fetch user
        const [userRows] = await pool.query(
            `SELECT user_id, username, email, gender, role, status AS account_status FROM users WHERE user_id = ?`,
            [userId]
        );
        if (!userRows.length) return res.status(404).json({ success: false, message: "User not found" });
        const user = userRows[0];

        // Fetch member
        const [memberRows] = await pool.query(
            `SELECT member_id, first_name, last_name, student_id, phone, payment_option, subscription_id
             FROM members WHERE user_id = ?`,
            [userId]
        );
        if (!memberRows.length) return res.status(404).json({ success: false, message: "Member not found" });
        const member = memberRows[0];

        // Fetch subscription
        let subscription = {};
        if (member.subscription_id) {
            const [subRows] = await pool.query(
                `SELECT plan_name, amount AS plan_amount, duration_days FROM subscriptions WHERE subscription_id = ?`,
                [member.subscription_id]
            );
            subscription = subRows[0] || {};
        }

        // Fetch latest payment
        const [paymentRows] = await pool.query(
            `SELECT id AS payment_id, amount AS payment_amount, payment_method, details, status AS payment_status, payment_proof, created_at AS payment_date
             FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        const payment = paymentRows[0] || {};

        res.json({
            success: true,
            payment: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                gender: user.gender,
                role: user.role,
                account_status: user.account_status,
                first_name: member.first_name,
                last_name: member.last_name,
                student_id: member.student_id,
                phone: member.phone,
                payment_option: member.payment_option,
                plan_name: subscription.plan_name || null,
                plan_amount: subscription.plan_amount || null,
                duration_days: subscription.duration_days || null, // always from subscription
                payment_id: payment.payment_id || null,
                payment_amount: payment.payment_amount || null,
                payment_method: payment.payment_method || null,
                details: payment.details || null,
                payment_status: payment.payment_status || null,
                payment_proof: payment.payment_proof || null,
                payment_date: payment.payment_date || null,
            },
        });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Error fetching payment proof:`, err);
        res.status(500).json({ success: false, message: "Server error fetching payment proof" });
    }
};

// ======================= Approve Payment =======================
exports.approvePayment = async (req, res) => {
    try {
        const userId = req.params.user_id;
        if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

        // Fetch member + username
        const [memberRows] = await pool.query(
            `SELECT m.member_id, m.email, m.subscription_id, u.username
             FROM members m
             JOIN users u ON m.user_id = u.user_id
             WHERE m.user_id = ?`,
            [userId]
        );
        if (!memberRows.length) return res.status(404).json({ success: false, message: "Member not found" });
        const member = memberRows[0];

        // Fetch subscription duration (mandatory)
        const [subRows] = await pool.query(
            `SELECT duration_days FROM subscriptions WHERE subscription_id = ?`,
            [member.subscription_id]
        );
        const durationDays = subRows.length ? subRows[0].duration_days : 30;

        // Fetch latest payment
        const [paymentRows] = await pool.query(
            `SELECT id AS payment_id, amount AS payment_amount, payment_method, details, created_at AS payment_date
             FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        const payment = paymentRows[0];
        if (!payment) return res.status(404).json({ success: false, message: "No payment found" });

        // Calculate start/end dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);

        // Update payment status
        await pool.query(`UPDATE payments SET status = 'confirmed' WHERE id = ?`, [payment.payment_id]);

        // Activate user & member
        await pool.query(
            `UPDATE members m
             JOIN users u ON m.user_id = u.user_id
             SET m.status = 'active', u.status = 'active', m.start_date = ?, m.end_date = ?
             WHERE u.user_id = ?`,
            [startDate, endDate, userId]
        );

        // Insert into payment_history
        let transactionId = `TX-${payment.payment_id}`; // fallback default

try {
  // If payment.details is JSON, parse it and extract only the transaction_id field
  const details = JSON.parse(payment.details);
  if (details.transaction_id) {
    transactionId = details.transaction_id;
  }
} catch (err) {
  // If it's not JSON, assume it might already be a plain string (like Txn 12345)
  if (payment.details && typeof payment.details === "string") {
    transactionId = payment.details;
  }
}

await pool.query(
  `INSERT INTO payment_history (payment_id, member_id, subscription_id, amount_paid, payment_date, status, transaction_id)
   VALUES (?, ?, ?, ?, ?, 'paid', ?)`,
  [
    payment.payment_id,
    member.member_id,
    member.subscription_id || null,
    payment.payment_amount,
    payment.payment_date,
    transactionId, // cleaned-up version
  ]
);


        // Send approval email
        const emailHtml = `
            <p>Hello ${member.username},</p>
            <p>Your payment has been approved. Your account is now active.</p>
            <p><strong>Start Date:</strong> ${startDate.toDateString()}<br/>
            <strong>End Date:</strong> ${endDate.toDateString()}</p>
            <p>Thank you for choosing UNZA Gym!</p>
        `;
        await sendEmail(member.email, "Payment Approved", emailHtml);

        res.json({ success: true, message: "Payment approved, user activated, email sent, payment history recorded." });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Error approving payment:`, err);
        res.status(500).json({ success: false, message: "Server error approving payment" });
    }
};

// ======================= Reject Payment =======================
exports.rejectPayment = async (req, res) => {
    try {
        const userId = req.params.user_id;
        if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

        // Fetch member + username
        const [memberRows] = await pool.query(
            `SELECT m.member_id, m.email, u.username
             FROM members m
             JOIN users u ON m.user_id = u.user_id
             WHERE m.user_id = ?`,
            [userId]
        );
        if (!memberRows.length) return res.status(404).json({ success: false, message: "Member not found" });
        const member = memberRows[0];

        // Reject pending payments
        await pool.query(`UPDATE payments SET status = 'rejected' WHERE user_id = ? AND status = 'pending'`, [userId]);

        // Deactivate user & member
        await pool.query(`UPDATE users SET status = 'inactive' WHERE user_id = ?`, [userId]);
        await pool.query(`UPDATE members SET status = 'inactive' WHERE user_id = ?`, [userId]);

        // Send rejection email
        const emailHtml = `
            <p>Hello ${member.username},</p>
            <p>Your payment has been rejected. Your account remains inactive.</p>
            <p>Please contact support for assistance.</p>
        `;
        await sendEmail(member.email, "Payment Rejected", emailHtml);

        res.json({ success: true, message: "Payment rejected, user deactivated, email sent." });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Error rejecting payment:`, err);
        res.status(500).json({ success: false, message: "Server error rejecting payment" });
    }
};
