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
      // Arrange
      await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      const response = await request(app)
        .get('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('equipment');
    });

    it('should return 401 without authorization', async () => {
      // Act
      const response = await request(app)
        .get('/api/service-reports')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/service-reports', () => {
    it('should create a service report', async () => {
      // Arrange
      const reportData = {
        equipment_id: testEquipment.id,
        visit_type: 'mensual',
        system_name: 'Sistema 1',
        report_date: '2026-06-08T12:00:00.000Z',
        water_energy_data: { consumo: 100 },
        motor_1_data: { rpm: 1500 },
        observations: 'Test observations',
        technician_name: 'John Doe'
      };

      // Act
      const response = await request(app)
        .post('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reportNumber');
      expect(response.body.data.reportNumber).toMatch(/^SRV-\d{4}$/);
      expect(response.body.data.technicianName).toBe('John Doe');
    });

    it('should create report without equipment and return error', async () => {
      // Act
      const response = await request(app)
        .post('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Se requiere seleccionar un equipo');
    });

    it('should generate sequential report numbers', async () => {
      // Arrange
      await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      const response = await request(app)
        .post('/api/service-reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ equipment_id: testEquipment.id })
        .expect(201);

      // Assert
      expect(response.body.data.reportNumber).toBe('SRV-0002');
    });
  });

  describe('GET /api/service-reports/:id', () => {
    it('should return a specific service report', async () => {
      // Arrange
      const report = await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      const response = await request(app)
        .get(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(report.id);
    });

    it('should return 404 for non-existent report', async () => {
      // Act
      const response = await request(app)
        .get('/api/service-reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/service-reports/:id', () => {
    it('should update a service report', async () => {
      // Arrange
      const report = await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      // OJO: este test enviaba visit_type:'semestral', que NO existe en
      // enum_service_reports_visitType. Pasaba solo porque SQLite no valida los
      // ENUM; contra Postgres habría sido un 500. Se usa un tipo real.
      const response = await request(app)
        .put(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ observations: 'Updated observations', visit_type: 'eventual' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.observations).toBe('Updated observations');
    });

    it('should return 404 for non-existent report', async () => {
      // Act
      const response = await request(app)
        .put('/api/service-reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ observations: 'Updated' })
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/service-reports/:id', () => {
    it('should delete a service report', async () => {
      // Arrange
      const report = await ServiceReport.create({
        reportNumber: 'SRV-0001',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      const response = await request(app)
        .delete(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reporte eliminado exitosamente');

      const deleted = await ServiceReport.findByPk(report.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent report', async () => {
      // Act
      const response = await request(app)
        .delete('/api/service-reports/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('Ownership / IDOR protection', () => {
    const { TechnicianEquipment } = require('../models');
    let technician;
    let technicianToken;

    const tokenFor = (user) =>
      jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'test_secret_for_testing_only',
        { expiresIn: '1d' }
      );

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      technician = await User.create({
        username: 'tech_other',
        email: 'tech_other@example.com',
        password: hashedPassword,
        role: 'technician',
        isActive: true
      });
      technicianToken = tokenFor(technician);
    });

    it('forbids a technician from reading a report of unassigned equipment', async () => {
      // Arrange
      const report = await ServiceReport.create({
        reportNumber: 'SRV-9001',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act & Assert
      await request(app)
        .get(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(403);
    });

    it('forbids a technician from deleting a report of unassigned equipment', async () => {
      // Arrange
      const report = await ServiceReport.create({
        reportNumber: 'SRV-9002',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      await request(app)
        .delete(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(403);

      // Assert
      const stillThere = await ServiceReport.findByPk(report.id);
      expect(stillThere).not.toBeNull();
    });

    it('allows a technician to read a report of assigned equipment', async () => {
      // Arrange
      const report = await ServiceReport.create({
        reportNumber: 'SRV-9003',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });
      await TechnicianEquipment.create({
        technicianId: technician.id,
        equipmentId: testEquipment.id
      });

      // Act
      const response = await request(app)
        .get(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.id).toBe(report.id);
    });

    it('forbids an assigned technician from deleting a report authored by someone else', async () => {
      // El equipo está asignado al técnico, pero el reporte lo creó el admin.
      // Lectura sí (canAccessReport), pero modificar/borrar NO (solo owner/admin).
      const report = await ServiceReport.create({
        reportNumber: 'SRV-9101',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });
      await TechnicianEquipment.create({
        technicianId: technician.id,
        equipmentId: testEquipment.id
      });

      await request(app)
        .delete(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(403);

      const stillThere = await ServiceReport.findByPk(report.id);
      expect(stillThere).not.toBeNull();
    });

    it('forbids an assigned technician from updating a report authored by someone else', async () => {
      const report = await ServiceReport.create({
        reportNumber: 'SRV-9102',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });
      await TechnicianEquipment.create({
        technicianId: technician.id,
        equipmentId: testEquipment.id
      });

      await request(app)
        .put(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ observations: 'intento de edición ajena' })
        .expect(403);
    });

    it('allows a technician to update their OWN report', async () => {
      const report = await ServiceReport.create({
        reportNumber: 'SRV-9103',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: technician.id
      });

      const response = await request(app)
        .put(`/api/service-reports/${report.id}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ observations: 'edición propia' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.observations).toBe('edición propia');
    });

    it('list only returns reports the technician can access', async () => {
      // Arrange
      await ServiceReport.create({
        reportNumber: 'SRV-9004',
        reportDate: new Date('2026-06-08T12:00:00.000Z'),
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      // Act
      const response = await request(app)
        .get('/api/service-reports')
        .set('Authorization', `Bearer ${technicianToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(0);
    });
  });
});