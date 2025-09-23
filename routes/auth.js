const express = require('express');
const router = express.Router();
const {
    login,
    adminDashboard,
    memberDashboard,
    logout
} = require('../controllers/authController');

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// -------------------- LOGIN --------------------
router.post('/login', login);          // general login for admin/member
router.post('/member-login', login);   // optional: same login for frontend fetch

// -------------------- DASHBOARDS --------------------
router.get('/admin', authenticateToken, authorizeRoles('admin'), adminDashboard);
router.get('/member', authenticateToken, authorizeRoles('member'), memberDashboard);

// -------------------- LOGOUT --------------------
router.get('/logout', logout);

module.exports = router;
