const jwt = require('jsonwebtoken');

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

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

/**
 * Generate a refresh token for a user
 * @param {number} userId - The user's ID
 * @returns {string} - The signed refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

/**
 * Verify a refresh token
 * @param {string} token - The refresh token
 * @returns {Object} - The decoded token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};
