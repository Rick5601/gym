const db = require('../config/db');

exports.getPaymenthistory = async (req, res) => {
    try {
        const userId = req.member.id; // user_id from JWT
        console.log("Logged-in userId:", userId);

        // Step 1: Get the member_id for this user
        const [memberRows] = await db.query(
            "SELECT member_id FROM members WHERE user_id = ?",
            [userId]
        );

        if (memberRows.length === 0) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        const memberId = memberRows[0].member_id;
        console.log("Corresponding member_id:", memberId);

        // Step 2: Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        // Step 3: Get total count for pagination
        const [countResult] = await db.query(
            "SELECT COUNT(*) AS total FROM payment_history WHERE member_id = ? AND is_archived = 0",
            [memberId]
        );
        const total = countResult[0].total;

        // Step 4: Get paginated payment history for this member_id
        const [payments] = await db.query(`
            SELECT 
                p.payment_id,
                p.member_id,
                m.user_id AS student_id,
                CONCAT(m.first_name, ' ', m.last_name) AS full_name,
                s.plan_name AS plan,
                DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS last_payment_date,
                DATE_FORMAT(DATE_ADD(p.payment_date, INTERVAL s.duration_days DAY), '%Y-%m-%d') AS expiry_date,
                p.amount_paid AS amount,
                p.status,
                p.is_archived
            FROM payment_history p
            JOIN members m ON p.member_id = m.member_id
            JOIN subscriptions s ON p.subscription_id = s.subscription_id
            WHERE p.member_id = ? AND p.is_archived = 0
            ORDER BY p.payment_date DESC
            LIMIT ? OFFSET ?
        `, [memberId, limit, offset]);

        console.log(`Payment history for member (page ${page}):`, payments);

        res.json({ 
            success: true, 
            paymenthistory: payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error("Failed to fetch payment history:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
