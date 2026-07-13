const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User Routes Integration Tests', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // FIX: Previously called sequelize.sync({ force: true }) on every test,
    // re-creating the entire schema each time. This is slow, unnecessary (schema
    // is already created by setup.js in beforeAll), and can race with the global
    // setup. We only need to clean user data to guarantee test isolation.
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
      {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  describe('GET /api/users', () => {
    it('should return all users without passwords', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({ username: 'user1', email: 'user1@example.com', password: hashedPassword, role: 'technician', isActive: true });
      await User.create({ username: 'user2', email: 'user2@example.com', password: hashedPassword, role: 'admin', isActive: true });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).not.toHaveProperty('password');
      expect(response.body.data[0]).toHaveProperty('username');
      expect(response.body.data[0]).toHaveProperty('email');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/status', () => {
    it('should activate a deactivated user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: false
      });

      const response = await request(app)
        .put(`/api/users/${user.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(response.body.data.isActive).toBe(true);
    });

    it('should deactivate an active user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: true
      });

      const response = await request(app)
        .put(`/api/users/${user.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.data.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/99999/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: true })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role from technician to admin', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: true
      });

      const response = await request(app)
        .put(`/api/users/${user.id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.data.role).toBe('admin');
    });

    it('should update user role from admin to technician', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });

      const response = await request(app)
        .put(`/api/users/${user.id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'technician' })
        .expect(200);

      expect(response.body.data.role).toBe('technician');
    });

    it('rechaza con 400 un rol inexistente (antes: 500 desde Postgres)', async () => {
      // `'user'` NO es un rol válido — el enum es admin|supervisor|technician|client.
      // Estos tests lo usaban y SQLite lo aceptaba; Postgres lo rechaza.
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'rolecheck',
        email: 'rolecheck@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: true
      });

      const response = await request(app)
        .put(`/api/users/${user.id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'user' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Rol inválido/);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/99999/role')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: true
      });

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Usuario eliminado');

      const deletedUser = await User.findByPk(user.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});