const asyncHandler = require('express-async-handler');
const { 
  User, 
  AdminTechnician, 
  TechnicianClient, 
  TechnicianEquipment,
  Client,
  Equipment
} = require('../models');

const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const validateRole = (user, requiredRoles) => {
  return requiredRoles.includes(user.role);
};

const AdminTechnicianController = {
  getTechniciansByAdmin: asyncHandler(async (req, res, _next) => {
    const { adminId } = req.params;
    
    if (!validateUUID(adminId)) {
      return res.status(400).json({ message: 'ID de administrador inválido' });
    }

    const assignments = await AdminTechnician.findAll({
      where: { adminId },
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role', 'isActive'] }
      ]
    });

    res.json(assignments.map(a => a.technician));
  }),

  getAdminsByTechnician: asyncHandler(async (req, res, _next) => {
    const { technicianId } = req.params;
    
    if (!validateUUID(technicianId)) {
      return res.status(400).json({ message: 'ID de técnico inválido' });
    }

    const assignments = await AdminTechnician.findAll({
      where: { technicianId },
      include: [
        { model: User, as: 'admin', attributes: ['id', 'username', 'email', 'role', 'isActive'] }
      ]
    });

    res.json(assignments.map(a => a.admin));
  }),

  assignTechnician: asyncHandler(async (req, res, _next) => {
    const { adminId, technicianId } = req.body;

    if (!adminId || !technicianId) {
      return res.status(400).json({ message: 'adminId y technicianId son requeridos' });
    }

    if (!validateUUID(adminId) || !validateUUID(technicianId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    const admin = await User.findByPk(adminId);
    if (!admin || !validateRole(admin, ['admin', 'supervisor'])) {
      return res.status(404).json({ message: 'Administrador no encontrado o rol inválido' });
    }

    const technician = await User.findByPk(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Técnico no encontrado o rol inválido' });
    }

    const existing = await AdminTechnician.findOne({ where: { adminId, technicianId } });
    if (existing) {
      return res.status(400).json({ message: 'El técnico ya está asignado a este administrador' });
    }

    const assignment = await AdminTechnician.create({ adminId, technicianId });
    const assignmentWithDetails = await AdminTechnician.findByPk(assignment.id, {
      include: [
        { model: User, as: 'admin', attributes: ['id', 'username', 'email', 'role'] },
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role'] }
      ]
    });

    res.status(201).json(assignmentWithDetails);
  }),

  removeTechnician: asyncHandler(async (req, res, _next) => {
    const { adminId, technicianId } = req.params;

    if (!validateUUID(adminId) || !validateUUID(technicianId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    const deleted = await AdminTechnician.destroy({ where: { adminId, technicianId } });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    res.json({ message: 'Técnico desasignado del administrador' });
  })
};

const TechnicianClientController = {
  getClientsByTechnician: asyncHandler(async (req, res, _next) => {
    const { technicianId } = req.params;
    
    if (!validateUUID(technicianId)) {
      return res.status(400).json({ message: 'ID de técnico inválido' });
    }

    const assignments = await TechnicianClient.findAll({
      where: { technicianId },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone', 'isActive'] }
      ]
    });

    res.json(assignments.map(a => a.client));
  }),

  getTechniciansByClient: asyncHandler(async (req, res, _next) => {
    const { clientId } = req.params;
    
    if (!validateUUID(clientId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    const assignments = await TechnicianClient.findAll({
      where: { clientId },
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role', 'isActive'] }
      ]
    });

    res.json(assignments.map(a => a.technician));
  }),

  assignClient: asyncHandler(async (req, res, _next) => {
    const { technicianId, clientId } = req.body;

    if (!technicianId || !clientId) {
      return res.status(400).json({ message: 'technicianId y clientId son requeridos' });
    }

    if (!validateUUID(technicianId) || !validateUUID(clientId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    const technician = await User.findByPk(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Técnico no encontrado o rol inválido' });
    }

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const existing = await TechnicianClient.findOne({ where: { technicianId, clientId } });
    if (existing) {
      return res.status(400).json({ message: 'El cliente ya está asignado a este técnico' });
    }

    const assignment = await TechnicianClient.create({ technicianId, clientId });
    const assignmentWithDetails = await TechnicianClient.findByPk(assignment.id, {
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role'] },
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });

    res.status(201).json(assignmentWithDetails);
  }),

  removeClient: asyncHandler(async (req, res, _next) => {
    const { technicianId, clientId } = req.params;

    if (!validateUUID(technicianId) || !validateUUID(clientId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    const deleted = await TechnicianClient.destroy({ where: { technicianId, clientId } });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    res.json({ message: 'Cliente desasignado del técnico' });
  }),

  getAllAssignments: asyncHandler(async (req, res, _next) => {
    const assignments = await TechnicianClient.findAll({
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role'] },
        { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });

    res.json(assignments);
  })
};

const TechnicianEquipmentController = {
  getEquipmentByTechnician: asyncHandler(async (req, res, _next) => {
    const { technicianId } = req.params;
    
    if (!validateUUID(technicianId)) {
      return res.status(400).json({ message: 'ID de técnico inválido' });
    }

    const assignments = await TechnicianEquipment.findAll({
      where: { technicianId },
      include: [
        { 
          model: Equipment, 
          as: 'equipment', 
          attributes: ['id', 'name', 'type', 'serialNumber', 'brand', 'status'],
          include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }]
        }
      ]
    });

    res.json(assignments.map(a => a.equipment));
  }),

  getTechniciansByEquipment: asyncHandler(async (req, res, _next) => {
    const { equipmentId } = req.params;
    
    if (!validateUUID(equipmentId)) {
      return res.status(400).json({ message: 'ID de equipo inválido' });
    }

    const assignments = await TechnicianEquipment.findAll({
      where: { equipmentId },
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role', 'isActive'] }
      ]
    });

    res.json(assignments.map(a => a.technician));
  }),

  assignEquipment: asyncHandler(async (req, res, _next) => {
    const { technicianId, equipmentId } = req.body;

    if (!technicianId || !equipmentId) {
      return res.status(400).json({ message: 'technicianId y equipmentId son requeridos' });
    }

    if (!validateUUID(technicianId) || !validateUUID(equipmentId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    const technician = await User.findByPk(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ message: 'Técnico no encontrado o rol inválido' });
    }

    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    const existing = await TechnicianEquipment.findOne({ where: { technicianId, equipmentId } });
    if (existing) {
      return res.status(400).json({ message: 'El equipo ya está asignado a este técnico' });
    }

    const assignment = await TechnicianEquipment.create({ technicianId, equipmentId });
    const assignmentWithDetails = await TechnicianEquipment.findByPk(assignment.id, {
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role'] },
        { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'type', 'serialNumber', 'brand', 'status'] }
      ]
    });

    res.status(201).json(assignmentWithDetails);
  }),

  removeEquipment: asyncHandler(async (req, res, _next) => {
    const { technicianId, equipmentId } = req.params;

    if (!validateUUID(technicianId) || !validateUUID(equipmentId)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    const deleted = await TechnicianEquipment.destroy({ where: { technicianId, equipmentId } });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    res.json({ message: 'Equipo desasignado del técnico' });
  }),

  getAllAssignments: asyncHandler(async (req, res, _next) => {
    const assignments = await TechnicianEquipment.findAll({
      include: [
        { model: User, as: 'technician', attributes: ['id', 'username', 'email', 'role'] },
        { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'type', 'serialNumber', 'brand', 'status'] }
      ]
    });

    res.json(assignments);
  })
};

module.exports = {
  AdminTechnicianController,
  TechnicianClientController,
  TechnicianEquipmentController
};
