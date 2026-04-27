// Setup for Jest tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_testing_only';
process.env.JWT_EXPIRES_IN = '1d';
process.env.DB_STORAGE = ':memory:'; // Use in-memory SQLite for tests

// Mock console.error and console.warn to reduce test noise
console.error = jest.fn();
console.warn = jest.fn();

// Import and configure database for tests
const { sequelize } = require('../config/database');

// Setup database before all tests
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Recreate tables for tests
  } catch (error) {
    console.error('Unable to connect to database for tests:', error);
  }
});

// Teardown database after all tests
afterAll(async () => {
  await sequelize.close();
});