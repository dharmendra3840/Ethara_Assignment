// src/middleware/auth.js
// JWT authentication middleware

const jwt = require('jsonwebtoken');

/**
 * Default export: Verify JWT token and attach user to req.user
 */
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Named export: Admin-only guard middleware
 */
module.exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
};
