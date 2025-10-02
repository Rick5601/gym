const bcrypt = require("bcryptjs");
const db = require("../config/db"); // DB connection

const resetPassword = async (req, res) => {
    const { password, token } = req.body;

    console.log("Reset Password Request Body:", req.body);

    // 1️⃣ Validate request
    if (!password || !token) {
        return res.status(400).json({ success: false, message: "Password and token are required." });
    }

    // 2️⃣ Enforce password rules
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    try {
        // 3️⃣ Verify token & expiry
        const [rows] = await db.query(
            "SELECT * FROM users WHERE reset_token = ? AND token_expiry > ? LIMIT 1",
            [token, Date.now()]
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
        }

        const user = rows[0];

        // 4️⃣ Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12); // stronger salt rounds

        // 5️⃣ Update password + clear reset fields
        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, token_expiry = NULL WHERE user_id = ?",
            [hashedPassword, user.id]
        );

        console.log(`✅ Password reset successful for user ID: ${user.id}`);

        return res.json({
            success: true,
            message: "Your password has been successfully reset. Please log in with your new password.",
        });
    } catch (err) {
        console.error("❌ Reset Password Error:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

module.exports = { resetPassword };
