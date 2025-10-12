const express = require("express");
const router = express.Router();
const path = require("path");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// Import Controllers
const pendingMembersController = require("../controllers/pendingmembersController");
const allMembersController = require("../controllers/allmembersController"); 
const memberStatusController = require("../controllers/memberstatusController"); 
const summaryCardController = require("../controllers/summarycardController");
const recentActivityController = require("../controllers/recentactivityController.js");
const announcementController = require("../controllers/announcementController");
const reportController = require("../controllers/adminreportController"); 
const adminPaymentController = require("../controllers/adminpaymentController");// ✅ Payment controller

// ------------------ HTML Pages ------------------ //
// Serve Admin Dashboard HTML
router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/admin_pages/admin_dashboard.html"));
  }
);

// Serve All Members Page
router.get(
  "/all-members-page",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/admin_pages/all_members.html"));
  }
);

// Serve Member Status Page
router.get(
  "/member-status-page",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/admin_pages/member_status.html"));
  }
);

// ✅ Serve Report Pages
router.get(
  "/report-membership",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/admin_pages/report_membership.html"));
  }
);

router.get(
  "/report-payments",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/admin_pages/report_payments.html"));
  }
);

router.get(
  "/report-attendance",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.sendFile(path.join(__dirname, "../public/admin_pages/report_attendance.html"));
  }
);

// ------------------ API Endpoints ------------------ //
// Get all members
router.get(
  "/all-members",
  authenticateToken,
  authorizeRoles("admin"),
  allMembersController.getAllMembers
);

// Get all pending members
router.get(
  "/pending-members",
  authenticateToken,
  authorizeRoles("admin"),
  pendingMembersController.getPendingMembers
);

  // Approve a pending member
  router.put(
    "/approve-member/:user_id",
    authenticateToken,
    authorizeRoles("admin"),
    pendingMembersController.approveMember
  );
  

// Get member status (admin only)
router.get(
  "/member-status",
  authenticateToken,
  authorizeRoles("admin"),
  memberStatusController.getMemberStatus
);

// Summary card endpoint (Admin-only)
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("admin"),
  summaryCardController.getSummaryData
);

// Recent Activity (Admin-only)
router.get(
  "/recent-activity",
  authenticateToken,
  authorizeRoles("admin"),
  recentActivityController.getRecentActivity
);

// Get all announcements (admin)
router.get(
  "/announcements",
  authenticateToken,
  authorizeRoles("admin"),
  announcementController.getAllAnnouncements
);

// Create announcement (admin)
router.post(
  "/announcements",
  authenticateToken,
  authorizeRoles("admin"),
  announcementController.createAnnouncement
);

// Archive / Unarchive announcement (admin)
router.put(
  "/announcements/:id/archive",
  authenticateToken,
  authorizeRoles("admin"),
  announcementController.toggleArchiveAnnouncement
);

// ------------------ Report APIs ------------------ //
// Membership
router.get(
  "/membership-report",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.getMembershipReport
);
router.get(
  "/membership-report/excel",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.exportMembershipExcel
);
router.get(
  "/membership-report/pdf",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.exportMembershipPDF
);

// Payment
router.get(
  "/payment-report",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.getPaymentReport
);
router.get(
  "/payment-report/excel",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.exportPaymentExcel
);
router.get(
  "/payment-report/pdf",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.exportPaymentPDF
);

// Attendance
router.get(
  "/attendance-report",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.getAttendanceReport
);
router.get(
  "/attendance-report/excel",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.exportAttendanceExcel
);
router.get(
  "/attendance-report/pdf",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.exportAttendancePDF
);

// ------------------ Payment Proof Endpoints ------------------ //
// Get payment proof + user details
router.get(
  "/payment-proof/:user_id",
  authenticateToken,
  authorizeRoles("admin"),
  adminPaymentController.getPaymentProof
);

// Approve payment
router.put(
  "/payment-approve/:user_id",
  authenticateToken,
  authorizeRoles("admin"),
  adminPaymentController.approvePayment
);

// Reject payment
router.put(
  "/payment-reject/:user_id",
  authenticateToken,
  authorizeRoles("admin"),
  adminPaymentController.rejectPayment
);

module.exports = router;
