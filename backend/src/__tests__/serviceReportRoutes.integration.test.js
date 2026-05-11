const request = require('supertest');
const app = require('../app');
const { ServiceReport, Equipment, Client, User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('ServiceReport Routes Integration Tests', () => {
  let authToken;
  let testUser;
  let testClient;
  let testEquipment;

  beforeEach(async () => {
    await ServiceReport.destroy({ where: {} });
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

    testEquipment = await Equipment.create({
      name: 'Test Pump',
      type: 'centrifugal',
      serialNumber: 'SN-001',
      clientId: testClient.id
    });

    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  describe('GET /api/service-reports', () => {
    it('should return all service reports with associations', async () => {
      await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date(),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      const response = await request(app)
        .get('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toHaveProperty('equipment');
    });

    it('should return 401 without authorization', async () => {
      const response = await request(app)
        .get('/api/service-reports')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/service-reports', () => {
    it('should create a service report', async () => {
      const reportData = {
        equipment_id: testEquipment.id,
        visit_type: 'mensual',
        system_name: 'Sistema 1',
        report_date: new Date().toISOString(),
        water_energy_data: { consumo: 100 },
        motor_1_data: { rpm: 1500 },
        observations: 'Test observations',
        technician_name: 'John Doe'
      };

      const response = await request(app)
        .post('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reportNumber');
      expect(response.body.data.reportNumber).toMatch(/^SRV-\d{4}$/);
      expect(response.body.data.technicianName).toBe('John Doe');
    });

    it('should create report without equipment and return error', async () => {
      const response = await request(app)
        .post('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Se requiere seleccionar un equipo');
    });

    it('should generate sequential report numbers', async () => {
      await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date(),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      const response = await request(app)
        .post('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ equipment_id: testEquipment.id })
        .expect(201);

      expect(response.body.data.reportNumber).toBe('SRV-0002');
    });
  });

  describe('GET /api/service-reports/:id', () => {
    it('should return a specific service report', async () => {
      const report = await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date(),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      const response = await request(app)
        .get(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(report.id);
    });

    it('should return 404 for non-existent report', async () => {
      const response = await request(app)
        .get('/api/service-reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/service-reports/:id', () => {
    it('should update a service report', async () => {
      const report = await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date(),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      const response = await request(app)
        .put(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ observations: 'Updated observations', visit_type: 'semestral' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.observations).toBe('Updated observations');
    });

    it('should return 404 for non-existent report', async () => {
      const response = await request(app)
        .put('/api/service-reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ observations: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/service-reports/:id', () => {
    it('should delete a service report', async () => {
      const report = await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date(),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      const response = await request(app)
        .delete(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reporte eliminado exitosamente');

      const deleted = await ServiceReport.findByPk(report.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent report', async () => {
      const response = await request(app)
        .delete('/api/service-reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});