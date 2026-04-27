const { getStats } = require('../controllers/dashboardController');

describe('Dashboard Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getStats', () => {
    it('should return 200 and mocked stats', async () => {
      await getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        total_clients: 42,
        total_equipment: 156,
        total_reports: 89,
        total_technicians: 12,
        pending_maintenance: 5
      });
    });
  });
});
