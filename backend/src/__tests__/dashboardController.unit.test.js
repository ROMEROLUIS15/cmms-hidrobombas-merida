const { getStats } = require('../controllers/dashboardController');

// FIX: Previously, mocks were defined inline in jest.mock() with hardcoded
// .mockResolvedValue() return values. This made them non-configurable between
// tests — both tests called getStats() with the same mock state, making the
// second test redundant. Hoisting the mocks and configuring them in beforeEach
// allows each test to assert a distinct scenario with specific values.
jest.mock('../models', () => ({
  Client:        { count: jest.fn() },
  Equipment:     { count: jest.fn() },
  ServiceReport: { count: jest.fn() },
  User:          { count: jest.fn() },
}));

const { Client, Equipment, ServiceReport, User } = require('../models');

describe('Dashboard Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();

    // Arrange: configure known return values for each test by default.
    // Individual tests can override these to simulate different DB states.
    Client.count.mockResolvedValue(5);
    Equipment.count.mockResolvedValue(12);
    ServiceReport.count.mockResolvedValue(30);
    User.count.mockResolvedValue(3);
  });

  describe('getStats', () => {
    it('should return 200 with a success response containing all dashboard stat keys', async () => {
      // Act
      await getStats(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('total_clients');
      expect(body.data).toHaveProperty('total_equipment');
      expect(body.data).toHaveProperty('total_reports');
      expect(body.data).toHaveProperty('total_technicians');
      expect(body.data).toHaveProperty('pending_maintenance');
    });

    it('should return the exact numeric counts provided by the database models', async () => {
      // Arrange: specific values to verify exact passthrough (not just type)
      Client.count.mockResolvedValue(7);
      Equipment.count.mockResolvedValue(15);
      ServiceReport.count.mockResolvedValue(42);
      User.count.mockResolvedValue(4);

      // Act
      await getStats(req, res);

      // Assert: verify exact values, not just that they are numbers
      const { data } = res.json.mock.calls[0][0];
      expect(data.total_clients).toBe(7);
      expect(data.total_equipment).toBe(15);
      expect(data.total_reports).toBe(42);
      expect(data.total_technicians).toBe(4);
    });
  });
});
