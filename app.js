const express = require('express');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');        
const adminRoutes = require('./routes/adminRoutes'); 
const memberRoutes = require('./routes/memberRoutes'); 
const signupRoutes = require('./routes/signupRoutes');
const verifyRoute = require('./routes/verifyRoutes'); // ✅ added

// Middleware
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();

// -------------------- Middleware --------------------

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- Logging middleware --------------------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// -------------------- Routes --------------------

// Public routes (no auth required)
app.use('/api/auth', authRoutes);     // login/register
app.use('/api/signup', signupRoutes); // signup route
app.use('/api', verifyRoute);         // ✅ verify route

// Protected routes
app.use('/api/admin', authenticateToken, adminRoutes);   // admin-only routes
app.use('/api/member', memberRoutes); // member (and admin) routes

// Root route: login page
app.get('/', (req, res) => {
  console.log("Root page requested");
  res.sendFile(path.join(__dirname, 'public/admin_login.html'));
});

// Test route
app.get('/api/member/test', authenticateToken, (req, res) => {
  console.log("Member test route hit");
  res.json({ success: true, message: 'Member test route works!' });
});

// -------------------- 404 handler --------------------
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// -------------------- Global error handler --------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

module.exports = app;
