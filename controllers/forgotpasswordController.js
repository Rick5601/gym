const crypto = require("crypto");
const db = require("../config/db"); // your DB connection
require("dotenv").config();

const { MailerSend, EmailParams, Recipient, Sender } = require("mailersend");

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sendResetEmail = async (req, res) => {
  console.log("Forgot Password Request Body:", req.body);

  const { email } = req.body;

  // 1️⃣ Validate request
  if (!email || email.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  try {
    // 2️⃣ Check if user exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No account found with that email." });
    }

    // 3️⃣ Generate reset token and expiry
    const token = crypto.randomBytes(20).toString("hex");
    const expiry = Date.now() + 3600000; // 1 hour

    // 4️⃣ Save token & expiry in DB
    await db.query(
      "UPDATE users SET reset_token = ?, token_expiry = ? WHERE email = ?",
      [token, expiry, email]
    );

    // 5️⃣ Generate reset link
    const resetLink = `http://localhost:5000/reset_password.html?token=${token}`;

    // 6️⃣ Setup MailerSend email params
    const sentFrom = new Sender(
      process.env.MAILERSEND_FROM_EMAIL, // must be verified/test domain
      "Gym System"
    );
    const recipients = [new Recipient(email, "User")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Gym System Password Reset")
      .setHtml(
        `
        <p>You requested a password reset for your Gym account.</p>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this, please ignore this email.</p>
      `
      )
      .setText(
        `You requested a password reset. Reset link (valid 1 hour): ${resetLink}`
      );

    // 7️⃣ Send email
    await mailerSend.email.send(emailParams);

    console.log(`✅ Password reset email sent to ${email}`);
    res.json({
      success: true,
      message: "Password reset email sent! Check your inbox.",
    });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error. Please try again later." });
  }
};

module.exports = { sendResetEmail };
