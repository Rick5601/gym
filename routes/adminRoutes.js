const express = require("express");
const router = express.Router();
const path = require("path");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// Import Controllers
const pendingMembersController = require("../controllers/pendingMembersController");
const allMembersController = require("../controllers/allmembersController"); // fixed capitalization
const memberStatusController = require("../controllers/memberstatusController"); // new controller
const summaryCardController = require("../controllers/summarycardController");
const recentActivityController = require("../controllers/recentactivityController.js");
const announcementController = require("../controllers/announcementController");

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
  "/approve-member/:username",
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

module.exports = router;
