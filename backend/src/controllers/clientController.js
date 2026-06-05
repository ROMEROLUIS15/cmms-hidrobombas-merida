const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { Client, Equipment } = require('../models');
const { getPaginationParams, paginatedResponse } = require('../utils/pagination');
const { isPrivileged, getUserId, getAssignedClientIds, canAccessClient } = require('../utils/ownership');

const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const createNotFoundError = (resource) => {
  const error = new Error(`${resource} no encontrado`);
  error.statusCode = 404;
  return error;
};

// ─── GET /api/clients ─────────────────────────────────────────────────────────
const getClients = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);

  // Ownership: el técnico solo ve clientes asignados.
  const where = {};
  if (!isPrivileged(req.user)) {
    const assignedIds = await getAssignedClientIds(getUserId(req.user));
    where.id = { [Op.in]: assignedIds };
  }

  const { rows: clients, count: total } = await Client.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset
  });

  res.status(200).json({
    success: true,
    ...paginatedResponse(clients, total, page, limit)
  });
});

// ─── GET /api/clients/:id ─────────────────────────────────────────────────────
const getClientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!validateUUID(id)) {
    throw createNotFoundError('Cliente');
  }

  if (!(await canAccessClient(req.user, id))) {
    const error = new Error('No tienes permiso para acceder a este cliente');
    error.statusCode = 403;
    throw error;
  }

  const client = await Client.findByPk(id, {
    include: [{ model: Equipment, as: 'equipment' }]
  });

  if (!client) {
    throw createNotFoundError('Cliente');
  }
  res.status(200).json({ success: true, data: client });
});

// ─── POST /api/clients ────────────────────────────────────────────────────────
const createClient = asyncHandler(async (req, res) => {
  const { name, email, phone, address, contactPerson, rif } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'El nombre del cliente es requerido' });
  }

  const client = await Client.create({ name, email, phone, address, contactPerson, rif });
  res.status(201).json({ success: true, data: client });
});

// ─── PUT /api/clients/:id ─────────────────────────────────────────────────────
const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validateUUID(id)) {
    const error = new Error('ID de cliente inválido');
    error.statusCode = 400;
    throw error;
  }

  const client = await Client.findByPk(id);
  if (!client) {
    throw createNotFoundError('Cliente');
  }
  const allowedFields = ['name', 'email', 'phone', 'address', 'contactPerson', 'rif'];
  const filtered = allowedFields.reduce((obj, key) => {
    if (req.body[key] !== undefined) obj[key] = req.body[key];
    return obj;
  }, {});
  await client.update(filtered);
  res.status(200).json({ success: true, data: client });
});

// ─── DELETE /api/clients/:id ──────────────────────────────────────────────────
const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!validateUUID(id)) {
    throw createNotFoundError('Cliente');
  }
  
  const client = await Client.findByPk(id);
  if (!client) {
    throw createNotFoundError('Cliente');
  }
  await client.destroy();
  res.status(200).json({ success: true, message: 'Cliente eliminado exitosamente' });
});

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };