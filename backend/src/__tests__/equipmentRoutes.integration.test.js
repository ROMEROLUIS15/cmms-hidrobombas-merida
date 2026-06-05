const request = require('supertest');
const app = require('../app');
const { Equipment, Client, ServiceReport, User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Equipment Routes Integration Tests', () => {
  let authToken;
  let testUser;
  let testClient;

  beforeEach(async () => {
    await Equipment.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Client.destroy({ where: {} });

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    testClient = await Client.create({
      name: 'Test Client',
      email: 'client@example.com',
      phone: '1234567890',
      address: '123 Test St'
    });

    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  describe('GET /api/equipment', () => {
    it('should return all equipment', async () => {
      await Equipment.create({ name: 'Pump A', type: 'centrifugal', serialNumber: 'SN-001', clientId: testClient.id });
      await Equipment.create({ name: 'Pump B', type: 'centrifugal', serialNumber: 'SN-002', clientId: testClient.id });

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter equipment by clientId', async () => {
      const client2 = await Client.create({ name: 'Client 2', email: 'c2@example.com', phone: '000', address: 'addr' });
      await Equipment.create({ name: 'Pump A', type: 'centrifugal', serialNumber: 'SN-001', clientId: testClient.id });
      await Equipment.create({ name: 'Pump B', type: 'centrifugal', serialNumber: 'SN-002', clientId: client2.id });

      const response = await request(app)
        .get(`/api/equipment?clientId=${testClient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Pump A');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/equipment', () => {
    it('should create equipment', async () => {
      const eqData = {
        name: 'New Pump',
        type: 'centrifuga',
        serialNumber: 'SN-NEW',
        brand: 'Flygt',
        clientId: testClient.id
      };

      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eqData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Pump');
      expect(response.body.data.status).toBe('active');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ clientId: testClient.id })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when clientId is missing', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Pump' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/equipment/:id', () => {
    it('should return equipment by id with client and reports', async () => {
      const eq = await Equipment.create({ name: 'Pump A', type: 'centrifugal', serialNumber: 'SN-001', clientId: testClient.id });

      const response = await request(app)
        .get(`/api/equipment/${eq.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Pump A');
      expect(response.body.data).toHaveProperty('client');
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .get('/api/equipment/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/equipment/:id', () => {
    it('should update equipment', async () => {
      const eq = await Equipment.create({ name: 'Pump A', type: 'centrifugal', serialNumber: 'SN-001', clientId: testClient.id });

      const response = await request(app)
        .put(`/api/equipment/${eq.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Pump', brand: 'Grundfos' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Pump');
      expect(response.body.data.brand).toBe('Grundfos');
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .put('/api/equipment/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/equipment/:id', () => {
    it('should delete equipment', async () => {
      const eq = await Equipment.create({ name: 'Pump A', type: 'centrifugal', serialNumber: 'SN-001', clientId: testClient.id });

      const response = await request(app)
        .delete(`/api/equipment/${eq.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Equipo eliminado exitosamente');

      const deleted = await Equipment.findByPk(eq.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .delete('/api/equipment/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Ownership / role restrictions', () => {
    const { TechnicianEquipment } = require('../models');
    let technician;
    let technicianToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      technician = await User.create({
        username: 'tech_eq',
        email: 'tech_eq@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: true
      });
      technicianToken = jwt.sign(
        { userId: technician.id, email: technician.email, role: technician.role },
        process.env.JWT_SECRET || 'test_secret_for_testing_only',
        { expiresIn: '1d' }
      );
    });

    it('list returns only equipment assigned to the technician', async () => {
      const eqA = await Equipment.create({ name: 'Pump A', type: 'centrifugal', serialNumber: 'SN-A', clientId: testClient.id });
      await Equipment.create({ name: 'Pump B', type: 'centrifugal', serialNumber: 'SN-B', clientId: testClient.id });
      await TechnicianEquipment.create({ technicianId: technician.id, equipmentId: eqA.id });

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(eqA.id);
    });

    it('forbids a technician from reading unassigned equipment', async () => {
      const eq = await Equipment.create({ name: 'Pump X', type: 'centrifugal', serialNumber: 'SN-X', clientId: testClient.id });

      await request(app)
        .get(`/api/equipment/${eq.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(403);
    });

    it('forbids a technician from creating equipment', async () => {
      await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ name: 'New Pump', type: 'centrifugal', clientId: testClient.id })
        .expect(403);
    });

    it('forbids a technician from deleting equipment', async () => {
      const eq = await Equipment.create({ name: 'Pump Y', type: 'centrifugal', serialNumber: 'SN-Y', clientId: testClient.id });

      await request(app)
        .delete(`/api/equipment/${eq.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(403);

      const stillThere = await Equipment.findByPk(eq.id);
      expect(stillThere).not.toBeNull();
    });
  });
});