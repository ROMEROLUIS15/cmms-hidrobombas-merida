const asyncHandler = require('express-async-handler');
const { Equipment, Client, ServiceReport } = require('../models');
const { getPaginationParams, paginatedResponse } = require('../utils/pagination');

const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const getEquipmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!validateUUID(id)) {
    const error = new Error('Equipo no encontrado');
    error.statusCode = 404;
    throw error;
  }
  
  const eq = await Equipment.findByPk(id, {
    include: [
      { model: Client, as: 'client' },
      {
        model: ServiceReport,
        as: 'reports',
        attributes: ['id', 'reportNumber', 'reportDate', 'visitType'],
        order: [['reportDate', 'DESC']],
        limit: 10
      }
    ]
  });

  if (!eq) {
    const error = new Error('Equipo no encontrado');
    error.statusCode = 404;
    throw error;
  }
  res.status(200).json({ success: true, data: eq });
});

// ─── GET /api/equipment ───────────────────────────────────────────────────────
const getEquipment = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const { page, limit, offset } = getPaginationParams(req.query);

  const where = clientId ? { clientId } : {};

  const { rows: equipment, count: total } = await Equipment.findAndCountAll({
    where,
    include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
    limit,
    offset
  });

  res.status(200).json({
    success: true,
    ...paginatedResponse(equipment, total, page, limit)
  });
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
  const { id } = req.params;
  
  if (!validateUUID(id)) {
    const error = new Error('Equipo no encontrado');
    error.statusCode = 404;
    throw error;
  }
  
  const eq = await Equipment.findByPk(id);
  if (!eq) {
    const error = new Error('Equipo no encontrado');
    error.statusCode = 404;
    throw error;
  }
  await eq.update(req.body);
  res.status(200).json({ success: true, data: eq });
});

// ─── DELETE /api/equipment/:id ────────────────────────────────────────────────
const deleteEquipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!validateUUID(id)) {
    const error = new Error('Equipo no encontrado');
    error.statusCode = 404;
    throw error;
  }
  
  const eq = await Equipment.findByPk(id);
  if (!eq) {
    const error = new Error('Equipo no encontrado');
    error.statusCode = 404;
    throw error;
  }
  await eq.destroy();
  res.status(200).json({ success: true, message: 'Equipo eliminado exitosamente' });
});

module.exports = { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment };
