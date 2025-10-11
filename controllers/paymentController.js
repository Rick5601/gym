const db = require('../config/db');

exports.savePayment = async (req, res) => {
    try {
        const { student_id, payment_method, amount, details } = req.body;

        // 1️⃣ Get user_id from members table using student_id
        const [members] = await db.query(
            "SELECT user_id FROM members WHERE student_id = ?", 
            [student_id]
        );
        if (!members.length) {
            return res.status(400).json({ success: false, message: "Invalid student ID" });
        }
        const user_id = members[0].user_id;

        // 2️⃣ Prepare payment details
        let paymentDetails = JSON.parse(details || '{}');

        // 3️⃣ Determine payment proof path (if uploaded)
        const paymentProofPath = req.file ? `uploads/payments/${req.file.filename}` : null;

        // Optionally, also store inside details JSON
        if (paymentProofPath) {
            paymentDetails.proof_image = paymentProofPath;
        }

        // 4️⃣ Insert payment record with payment_proof column
        const [result] = await db.query(
            `INSERT INTO payments (user_id, payment_method, amount, details, payment_proof, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [user_id, payment_method, amount, JSON.stringify(paymentDetails), paymentProofPath]
        );

        return res.status(201).json({
            success: true,
            message: 'Payment submitted successfully, pending admin verification',
            payment_id: result.insertId
        });
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
