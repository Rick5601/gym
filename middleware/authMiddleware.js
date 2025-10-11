// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper: extract token from header or cookie
const getToken = (req) => {
  let token = null;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  return token;
};

module.exports = {
  // Verify JWT token (for members or admins)
  authenticateToken: (req, res, next) => {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({ message: "Access denied: No token provided." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach decoded payload to req
      if (decoded.role === "member") {
        req.member = decoded;
      } else if (decoded.role === "admin") {
        req.admin = decoded;
      } else {
        req.user = decoded;
      }

      next();
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
  },

  // Middleware to check if user has specific role(s)
  authorizeRoles: (...allowedRoles) => {
    return (req, res, next) => {
      const role = req.member?.role || req.admin?.role || req.user?.role;

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Forbidden: insufficient rights." });
      }

      next();
    };
  },

  // New middleware: allow member or admin
  verifyMemberOrAdmin: (req, res, next) => {
    if (req.member || req.admin) {
      next();
    } else {
      return res.status(403).json({ message: "Access denied: Members or Admins only." });
    }
  },

  // Middleware for member-only routes
  verifyMember: (req, res, next) => {
    if (!req.member || req.member.role !== "member") {
      return res.status(403).json({ message: "Access denied: Members only." });
    }
    next();
  },

  // Middleware for admin-only routes
  verifyAdmin: (req, res, next) => {
    if (!req.admin || req.admin.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only." });
    }
    next();
  }
};
