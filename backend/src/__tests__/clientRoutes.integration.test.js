const request = require('supertest');
const app = require('../app');
const { Client, User } = require('../models');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Client Routes Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Sync the database schema
    await sequelize.sync({ force: true });
    
    // Create a test user and generate a token
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'admin',  // Explicitly set the role
      isActive: true  // Explicitly set active status
    });
    
    // Generate JWT token for the test user with the correct format
    authToken = jwt.sign(
      { 
        userId: testUser.id,  // Using userId as expected by the middleware
        email: testUser.email,
        role: testUser.role 
      },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  beforeEach(async () => {
    // Clear clients table before each test
    await Client.destroy({ where: {} });
  });


  describe('GET /api/clients', () => {
    it('should return all clients', async () => {
      // Create sample clients
      await Client.create({
        name: 'Test Client 1',
        email: 'test1@example.com',
        phone: '1234567890',
        address: '123 Test St'
      });
      
      await Client.create({
        name: 'Test Client 2',
        email: 'test2@example.com',
        phone: '0987654321',
        address: '456 Another St'
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const newClient = {
        name: 'New Test Client',
        email: 'newclient@example.com',
        phone: '1112223333',
        address: '789 New Address St'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newClient)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newClient.name);
      expect(response.body.data.email).toBe(newClient.email);
      expect(response.body.data.phone).toBe(newClient.phone);
      expect(response.body.data.address).toBe(newClient.address);
    });

    it('should return error when creating client without required name', async () => {
      const invalidClient = {
        email: 'invalid@example.com',
        phone: '1112223333',
        address: '789 New Address St'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidClient)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return a specific client', async () => {
      const client = await Client.create({
        name: 'Test Client Detail',
        email: 'detail@example.com',
        phone: '1234567890',
        address: '123 Test St'
      });

      const response = await request(app)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(client.id);
      expect(response.body.data.name).toBe(client.name);
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = 'non-existent-id';

      const response = await request(app)
        .get(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});