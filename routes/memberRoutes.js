const express = require("express");
const router = express.Router();

// Controllers
const memberController = require("../controllers/memberController");
const memberannouncementsController = require("../controllers/memberannouncementsController");
const reportController = require("../controllers/reportController");
const paymenthistoryController = require("../controllers/paymenthistoryController");
const loginhistoryController = require("../controllers/loginhistoryController"); // import full controller

// Middleware
const { authenticateToken, authorizeRoles, verifyMember } = require("../middleware/authMiddleware");

// -------------------- MEMBER PROFILE ROUTE --------------------
router.get(
  "/profile",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  memberController.getProfile
);

// -------------------- MEMBER ANNOUNCEMENTS ROUTE --------------------
router.get(
  "/announcements",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  memberannouncementsController.getAnnouncements
);

// -------------------- MEMBER REPORT ROUTES --------------------
router.get(
  "/reports",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  reportController.getReports
);

router.post(
  "/reports",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  reportController.submitReport
);

// -------------------- MEMBER PAYMENT HISTORY ROUTE --------------------
router.get(
  "/payment-history",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  paymenthistoryController.getPaymenthistory
);

// -------------------- MEMBER LOGIN HISTORY ROUTE --------------------
router.get(
  "/login-history",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  loginhistoryController.getLoginHistory
);

// -------------------- MEMBER CHECK-IN ROUTE --------------------
router.post(
  "/checkin",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  loginhistoryController.checkIn
);

// -------------------- MEMBER CHECK-OUT ROUTE --------------------
router.post(
  "/checkout",
  authenticateToken,
  authorizeRoles("member"),
  verifyMember,
  loginhistoryController.checkOut
);

// -------------------- TEST ROUTE --------------------
router.get("/test", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Member test route works!" });
});

module.exports = router;
