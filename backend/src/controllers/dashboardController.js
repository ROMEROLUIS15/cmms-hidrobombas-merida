const asyncHandler = require('express-async-handler');
const { Client, Equipment, ServiceReport, User } = require('../models');

const getStats = asyncHandler(async (req, res) => {
  const [total_clients, total_equipment, total_reports, total_technicians] = await Promise.all([
    Client.count(),
    Equipment.count(),
    ServiceReport.count(),
    User.count({ where: { role: 'technician', isActive: true } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      total_clients,
      total_equipment,
      total_reports,
      total_technicians,
      pending_maintenance: 0
    }
  });
});

module.exports = {
  getStats
};
