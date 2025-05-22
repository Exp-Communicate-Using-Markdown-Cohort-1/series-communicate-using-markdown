const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Adjust path as necessary

/**
 * Generates a JWT token for a user.
 * @param {object} user - The user object, must contain id and role.
 * @param {string} user.id - The user's ID.
 * @param {string} user.role - The user's role.
 * @returns {string} The generated JWT token.
 */
const generateToken = (user) => {
  if (!user || !user.id || !user.role) {
    throw new Error('User ID and role are required to generate a token.');
  }

  const payload = {
    userId: user.id,
    role: user.role,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {object|null} The decoded payload if verification is successful, otherwise null.
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    return decoded;
  } catch (error) {
    // Handle specific errors like TokenExpiredError, JsonWebTokenError differently if needed
    console.error('Error verifying token:', error.message);
    return null; // Or throw error to be caught by caller
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
