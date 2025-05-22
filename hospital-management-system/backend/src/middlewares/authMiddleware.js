const jwt = require('jsonwebtoken'); // Though verifyToken abstracts it, good to be mindful
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils'); // Assuming jwtUtils.js is in utils

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extract token
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify token
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: 'Not authorized, token failed or expired' });
      }

      // 4. Attach user to request object
      // Fetch user from DB, excluding the password
      // Ensure 'userId' matches what's in your JWT payload from generateToken
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        // This case handles if a user was deleted after token issuance
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error);
      // Catching potential errors from User.findById or other unexpected issues
      return res.status(401).json({ message: 'Not authorized, token processing error' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Authorize middleware to check user role against allowed roles.
 * @param {...string} roles - An array of allowed role strings.
 * @returns {function} Express middleware function.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if req.user and req.user.role exist (should be set by 'protect' middleware)
    if (!req.user || !req.user.role) {
      // This indicates a potential setup error (authorize used before protect or protect failed to set user)
      console.error('RBAC Error: req.user or req.user.role not set. Ensure "protect" middleware runs first.');
      return res.status(500).json({ message: 'Server error: User context not properly set for authorization.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Your role ('${req.user.role}') does not have the required permission to access this resource.`,
      });
    }
    next(); // User has one of the allowed roles
  };
};

module.exports = { protect, authorize };
