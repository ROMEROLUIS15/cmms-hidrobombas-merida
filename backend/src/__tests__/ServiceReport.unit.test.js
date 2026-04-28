const { ServiceReport, Equipment, User, Client } = require('../models');
const { sequelize } = require('../config/database');

describe('ServiceReport Model Unit Tests', () => {
  let testClient, testEquipment, testUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    testClient = await Client.create({
      name: 'Test Client',
      email: 'client@test.com',
      phone: '1234567890',
      address: 'Test Address'
    });

    testEquipment = await Equipment.create({
      name: 'Test Pump',
      type: 'Water Pump',
      clientId: testClient.id
    });

    testUser = await User.create({
      username: 'tech1',
      email: 'tech@test.com',
      password: 'password123',
      role: 'technician'
    });
  });

  afterAll(async () => {
    // Tests teardown is handled by setup.js globally
  });

  afterEach(async () => {
    await ServiceReport.destroy({ where: {} });
  });

  describe('ServiceReport Schema', () => {
    it('should create a valid ServiceReport with all fields', async () => {
      const waterData = { tensionRST: '220V', consumo: '15A' };
      const motorsData = [{ name: 'Motor 1', current: '10A' }];
      const controlData = { mode: 'Auto' };

      const report = await ServiceReport.create({
        reportNumber: 'REP-001',
        visitType: 'technical',
        systemName: 'Sistema de Agua',
        waterEnergyData: waterData,
        motorsData: motorsData,
        controlData: controlData,
        observations: 'All good',
        technicianName: 'Tech Name',
        clientSignatureName: 'Client Name',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      expect(report.id).toBeDefined();
      expect(report.reportNumber).toBe('REP-001');
      expect(report.visitType).toBe('technical');
      
      // Check JSON getters/setters
      expect(report.waterEnergyData).toEqual(waterData);
      expect(report.motorsData).toEqual(motorsData);
      expect(report.controlData).toEqual(controlData);
      
      expect(report.equipmentId).toBe(testEquipment.id);
      expect(report.userId).toBe(testUser.id);
    });

    it('should use default values correctly', async () => {
      const report = await ServiceReport.create({
        equipmentId: testEquipment.id
      });

      expect(report.visitType).toBe('mensual'); // default value
      expect(report.reportDate).toBeDefined(); // default to NOW
      expect(Number(report.cost)).toBe(0);
      expect(report.motorsData).toEqual([]); // default getter returns [] for null motorsData
      expect(report.waterEnergyData).toBeNull(); // default getter returns null
    });
  });

  describe('Associations', () => {
    it('should associate with Equipment and User correctly', async () => {
      const report = await ServiceReport.create({
        visitType: 'mensual',
        equipmentId: testEquipment.id,
        userId: testUser.id
      });

      const fetchedReport = await ServiceReport.findByPk(report.id, {
        include: ['equipment', 'technician']
      });

      expect(fetchedReport.equipment).toBeDefined();
      expect(fetchedReport.equipment.id).toBe(testEquipment.id);
      expect(fetchedReport.equipment.name).toBe('Test Pump');

      expect(fetchedReport.technician).toBeDefined();
      expect(fetchedReport.technician.id).toBe(testUser.id);
      expect(fetchedReport.technician.username).toBe('tech1');
    });
  });
});
