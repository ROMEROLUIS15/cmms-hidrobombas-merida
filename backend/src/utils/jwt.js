const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

// En producción exigimos un secreto de refresh propio: derivarlo de JWT_SECRET
// lo haría predecible a partir del secreto de acceso. Fuera de producción se
// permite un fallback derivado para no romper el flujo de desarrollo/tests.
if (isProduction && !process.env.REFRESH_TOKEN_SECRET) {
  throw new Error(
    'REFRESH_TOKEN_SECRET es obligatorio en producción. ' +
    'Define una variable de entorno distinta de JWT_SECRET.'
  );
}

const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET}_refresh`;
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
