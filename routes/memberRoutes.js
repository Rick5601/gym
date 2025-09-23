const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const memberannouncementsController = require("../controllers/memberannouncementsController");
const reportController = require("../controllers/reportController");
const paymenthistoryController = require("../controllers/paymenthistoryController");
const { authenticateToken, authorizeRoles, verifyMember } = require("../middleware/authMiddleware");
const { getLoginHistory } = require("../controllers/loginhistoryController");

// -------------------- MEMBER PROFILE ROUTE --------------------
router.get(
  "/profile",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] /profile route hit by memberId: ${req.member?.id || 'unknown'}`);
    next();
  },
  memberController.getProfile
);

// -------------------- MEMBER ANNOUNCEMENTS ROUTE --------------------
router.get(
  "/announcements",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] /announcements route hit by memberId: ${req.member?.id || 'unknown'}`);
    next();
  },
  memberannouncementsController.getAnnouncements
);

// -------------------- MEMBER REPORT ROUTES --------------------
router.get(
  "/reports",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] /reports GET route hit by memberId: ${req.member?.id || 'unknown'}`);
    next();
  },
  reportController.getReports
);

router.post(
  "/reports",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] /reports POST route hit by memberId: ${req.member?.id || 'unknown'}`);
    next();
  },
  reportController.submitReport
);

// -------------------- MEMBER PAYMENT HISTORY ROUTE --------------------
router.get(
  "/payment-history",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] /payment-history route hit by memberId: ${req.member?.id || 'unknown'}`);
    next();
  },
  paymenthistoryController.getPaymenthistory
);

// -------------------- MEMBER LOGIN HISTORY ROUTE --------------------
router.get(
  "/login-history",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] /login-history route hit by memberId: ${req.member?.id || 'unknown'}`);
    next();
  },
  getLoginHistory
);

// -------------------- Optional: test route --------------------
router.get("/test", authenticateToken, (req, res) => {
  console.log(`[${new Date().toISOString()}] /test route hit by memberId: ${req.member?.id || 'unknown'}`);
  res.json({ success: true, message: "Member test route works!" });
});

module.exports = router;
