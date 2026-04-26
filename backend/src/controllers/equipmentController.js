const asyncHandler = require('express-async-handler');
const { Equipment, Client, ServiceReport } = require('../models');

// ─── GET /api/equipment ───────────────────────────────────────────────────────
const getEquipment = asyncHandler(async (req, res) => {
  const { clientId } = req.query;

  const where = clientId ? { clientId } : {};

  const equipment = await Equipment.findAll({
    where,
    include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
    order: [['name', 'ASC']]
  });
  res.status(200).json({ success: true, data: equipment });
});

// ─── GET /api/equipment/:id ───────────────────────────────────────────────────
const getEquipmentById = asyncHandler(async (req, res) => {
  const eq = await Equipment.findByPk(req.params.id, {
    include: [
      { model: Client, as: 'client' },
      {
        model: ServiceReport,
        as: 'serviceReports',
        attributes: ['id', 'reportNumber', 'reportDate', 'visitType'],
        order: [['reportDate', 'DESC']],
        limit: 10
      }
    ]
  });

  if (!eq) {
    return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
  }
  res.status(200).json({ success: true, data: eq });
});

// ─── POST /api/equipment ──────────────────────────────────────────────────────
const createEquipment = asyncHandler(async (req, res) => {
  const { name, type, serialNumber, brand, clientId, status } = req.body;

  if (!name || !clientId) {
    return res.status(400).json({ success: false, message: 'Nombre y cliente son requeridos' });
  }

  const eq = await Equipment.create({ name, type, serialNumber, brand, clientId, status: status || 'active' });
  res.status(201).json({ success: true, data: eq });
});

// ─── PUT /api/equipment/:id ───────────────────────────────────────────────────
const updateEquipment = asyncHandler(async (req, res) => {
  const eq = await Equipment.findByPk(req.params.id);
  if (!eq) {
    return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
  }
  await eq.update(req.body);
  res.status(200).json({ success: true, data: eq });
});

// ─── DELETE /api/equipment/:id ────────────────────────────────────────────────
const deleteEquipment = asyncHandler(async (req, res) => {
  const eq = await Equipment.findByPk(req.params.id);
  if (!eq) {
    return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
  }
  await eq.destroy();
  res.status(200).json({ success: true, message: 'Equipo eliminado exitosamente' });
});

module.exports = { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment };
