const express = require("express");
const router = express.Router();

// Controllers
const { sendResetEmail } = require("../controllers/forgotpasswordController");
const { resetPassword } = require("../controllers/resetpasswordController");

// Route: POST /api/password/forgot
router.post("/forgot", sendResetEmail);

// Route: POST /api/password/reset
router.post("/reset", resetPassword);

module.exports = router;
