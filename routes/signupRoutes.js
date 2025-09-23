const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');

// POST /api/signup/signup
router.post('/', signupController.registerMember);

module.exports = router;
