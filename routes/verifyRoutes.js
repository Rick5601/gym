const express = require('express');
const router = express.Router();
const { verifyEmail } = require('../controllers/verificationController');

// GET /api/verify-email?token=xyz
router.get('/verify-email', verifyEmail);

module.exports = router;
