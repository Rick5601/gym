const db = require('../config/db');

exports.savePayment = async (req, res) => {
    try {
        const {
            user_id,
            payment_method,
            amount,
            details // JSON string with extra info (cash: who paid, when; mobile_money: number, transaction id)
        } = req.body;

        let paymentDetails = JSON.parse(details || '{}');

        // If mobile_money, attach uploaded file path
        if (payment_method === 'mobile_money' && req.file) {
            paymentDetails.proof_image = req.file.filename;
        }

        const [result] = await db.query(
            `INSERT INTO payments (user_id, payment_method, amount, details, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [user_id, payment_method, amount, JSON.stringify(paymentDetails)]
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
