const { getStats } = require('../controllers/dashboardController');

// Mock all four models used by getStats
jest.mock('../models', () => ({
  Client: { count: jest.fn().mockResolvedValue(5) },
  Equipment: { count: jest.fn().mockResolvedValue(12) },
  ServiceReport: { count: jest.fn().mockResolvedValue(30) },
  User: { count: jest.fn().mockResolvedValue(3) }
}));

describe('Dashboard Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return 200 with real DB counts wrapped in { success, data }', async () => {
      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const callArg = res.json.mock.calls[0][0];
      expect(callArg.success).toBe(true);
      expect(callArg.data).toHaveProperty('total_clients');
      expect(callArg.data).toHaveProperty('total_equipment');
      expect(callArg.data).toHaveProperty('total_reports');
      expect(callArg.data).toHaveProperty('total_technicians');
      expect(callArg.data).toHaveProperty('pending_maintenance');
    });

    it('should return numeric counts from DB', async () => {
      await getStats(req, res);

      const { data } = res.json.mock.calls[0][0];
      expect(typeof data.total_clients).toBe('number');
      expect(typeof data.total_equipment).toBe('number');
      expect(typeof data.total_reports).toBe('number');
      expect(typeof data.total_technicians).toBe('number');
    });
  });
});
