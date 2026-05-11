const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

describe('Dashboard Routes Integration Tests', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await User.destroy({ where: {} });

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_clients');
      expect(response.body).toHaveProperty('total_equipment');
      expect(response.body).toHaveProperty('total_reports');
      expect(response.body).toHaveProperty('total_technicians');
      expect(response.body).toHaveProperty('pending_maintenance');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});