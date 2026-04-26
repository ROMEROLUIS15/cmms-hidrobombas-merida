const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {number} userId - The user's ID
 * @param {string} email - The user's email
 * @param {string} role - The user's role
 * @returns {string} - The signed JWT token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  generateToken
};
