const { Equipment, Client } = require('../models');
const { sequelize } = require('../config/database');

describe('Equipment Model Unit Tests', () => {
  let testClient;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    testClient = await Client.create({
      name: 'Test Client Equip',
      email: 'clientequip@test.com',
      phone: '1234567890',
      address: 'Test Address Equip'
    });
  });

  afterAll(async () => {
    // Teardown handled globally by setup.js
  });

  afterEach(async () => {
    await Equipment.destroy({ where: {} });
  });

  describe('Equipment Schema', () => {
    it('should create an Equipment with valid fields', async () => {
      const equip = await Equipment.create({
        name: 'Pump Alpha',
        type: 'Centrifugal Pump',
        serialNumber: 'SN-12345',
        brand: 'AquaPro',
        status: 'Operativo',
        clientId: testClient.id
      });

      expect(equip.id).toBeDefined();
      expect(equip.name).toBe('Pump Alpha');
      expect(equip.type).toBe('Centrifugal Pump');
      expect(equip.serialNumber).toBe('SN-12345');
      expect(equip.brand).toBe('AquaPro');
      expect(equip.status).toBe('Operativo');
      expect(equip.clientId).toBe(testClient.id);
    });

    it('should throw an error if name is empty', async () => {
      await expect(Equipment.create({
        name: '',
        type: 'Pump',
        clientId: testClient.id
      })).rejects.toThrow();
    });

    it('should use the default status of Operativo', async () => {
      const equip = await Equipment.create({
        name: 'Pump Beta',
        type: 'Submersible Pump',
        clientId: testClient.id
      });

      expect(equip.status).toBe('Operativo');
    });
  });
});
