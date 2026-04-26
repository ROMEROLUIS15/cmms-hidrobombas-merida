const asyncHandler = require('express-async-handler');
const { Client, Equipment } = require('../models');

// ─── GET /api/clients ─────────────────────────────────────────────────────────
const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.findAll({
    order: [['name', 'ASC']]
  });
  res.status(200).json({ success: true, data: clients });
});

// ─── GET /api/clients/:id ─────────────────────────────────────────────────────
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findByPk(req.params.id, {
    include: [{ model: Equipment, as: 'equipment' }]
  });

  if (!client) {
    return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
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
  const client = await Client.findByPk(req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
  }
  await client.update(req.body);
  res.status(200).json({ success: true, data: client });
});

// ─── DELETE /api/clients/:id ──────────────────────────────────────────────────
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
  }
  await client.destroy();
  res.status(200).json({ success: true, message: 'Cliente eliminado exitosamente' });
});

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };
