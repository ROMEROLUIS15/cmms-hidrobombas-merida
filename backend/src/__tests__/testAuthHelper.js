const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Helper function to create a test user and return authentication token
 * @param {Object} userData - Optional user data to override defaults
 * @returns {Promise<{user: Object, token: string}>} Object containing created user and auth token
 */
const authenticateTestUser = async (userData = {}) => {
  // Default test user data
  const defaultUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'admin',
    isActive: true,
    ...userData
  };

  // Hash the password
  const hashedPassword = await bcrypt.hash(defaultUserData.password, 10);
  
  // Create test user
  const user = await User.create({
    ...defaultUserData,
    password: hashedPassword
  });
  
  // Generate JWT token for the test user
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'test_secret_for_testing_only',
    { expiresIn: '1d' }
  );

  return { user, token };
};

/**
 * Clean up test user after tests
 * @param {string} userId - ID of user to delete
 */
const cleanupTestUser = async (userId) => {
  try {
    await User.destroy({ where: { id: userId } });
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
};

/**
 * Get headers with authorization token
 * @param {string} token - Authentication token
 * @returns {Object} Headers object with Authorization
 */
const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

module.exports = {
  authenticateTestUser,
  cleanupTestUser,
  getAuthHeaders
};