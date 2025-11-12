const express = require('express');
const path = require('path');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');        
const adminRoutes = require('./routes/adminRoutes'); 
const memberRoutes = require('./routes/memberRoutes'); 
const signupRoutes = require('./routes/signupRoutes');
const verifyRoute = require('./routes/verifyRoutes'); 
const passwordRoutes = require('./routes/passwordRoutes');  // combined forgot/reset
const paymentRoutes = require('./routes/paymentRoutes');

// Middleware
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();

// -------------------- Middleware --------------------

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images, HTML)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve uploaded files (payment proof images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- Logging middleware --------------------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// -------------------- Routes --------------------

// Public routes (no auth required)
app.use('/api/auth', authRoutes);        // login/register
app.use('/api/signup', signupRoutes);   // signup
app.use('/api', verifyRoute);           // verify routes
app.use('/api/password', passwordRoutes); // forgot & reset password
app.use('/api/payment', paymentRoutes);  // payment route

// Protected routes
app.use('/api/admin', authenticateToken, adminRoutes);   // admin-only routes
app.use('/api/member', authenticateToken, memberRoutes); // member routes

// -------------------- HTML pages --------------------

// Root route: admin login page
app.get('/', (req, res) => {
  console.log("Root page requested");
  res.sendFile(path.join(__dirname, 'public/landing.html'));
});

// Member login page
app.get('/member-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/member_login.html'));
});

// Forgot password page
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/forgot-password.html'));
});

// Reset password page
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/reset-password.html'));
});

// -------------------- Test route --------------------
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
