const { Client } = require('../models');
const { sequelize } = require('../config/database');

describe('Client Model Unit Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Teardown handled globally by setup.js
  });

  afterEach(async () => {
    await Client.destroy({ where: {} });
  });

  describe('Client Schema', () => {
    it('should create a Client with valid fields', async () => {
      const client = await Client.create({
        name: 'Test Client',
        email: 'client@example.com',
        phone: '123456789',
        address: '123 Test St',
        isActive: true
      });

      expect(client.id).toBeDefined();
      expect(client.name).toBe('Test Client');
      expect(client.email).toBe('client@example.com');
      expect(client.phone).toBe('123456789');
      expect(client.address).toBe('123 Test St');
      expect(client.isActive).toBe(true);
    });

    it('should throw an error if name is missing', async () => {
      await expect(Client.create({
        email: 'test@example.com'
      })).rejects.toThrow();
    });

    it('should throw an error if email is invalid', async () => {
      await expect(Client.create({
        name: 'Invalid Email Client',
        email: 'not-an-email'
      })).rejects.toThrow();
    });

    it('should use default isActive as true', async () => {
      const client = await Client.create({
        name: 'Default Active Client'
      });

      expect(client.isActive).toBe(true);
    });
  });
});
