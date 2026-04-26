const asyncHandler = require('express-async-handler');

const getStats = asyncHandler(async (req, res) => {
  // Mock data for the dashboard stats
  res.status(200).json({
    total_clients: 42,
    total_equipment: 156,
    total_reports: 89,
    total_technicians: 12,
    pending_maintenance: 5
  });
});

module.exports = {
  getStats
};
