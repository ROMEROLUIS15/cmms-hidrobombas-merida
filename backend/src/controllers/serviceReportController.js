const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { ServiceReport, Equipment, Client, User } = require('../models');
const { getPaginationParams, paginatedResponse } = require('../utils/pagination');
const { isPrivileged, getUserId, getAssignedEquipmentIds, canAccessReport } = require('../utils/ownership');

const forbidden = () => {
  const error = new Error('No tienes permiso para acceder a este reporte');
  error.statusCode = 403;
  return error;
};

const validateUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const getReportById = async (id) => {
  if (!validateUUID(id)) {
    return null;
  }
  return await ServiceReport.findByPk(id);
};

// ─── Helper: generate sequential report number ────────────────────────────────
const generateReportNumber = async () => {
  const count = await ServiceReport.count();
  const next = String(count + 1).padStart(4, '0');
  return `SRV-${next}`;
};

// ─── GET /api/service-reports ─────────────────────────────────────────────────
const getServiceReports = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);

  // Ownership: admin/supervisor ven todo; el técnico solo sus reportes o los
  // de equipos asignados.
  let where;
  if (!isPrivileged(req.user)) {
    const uid = getUserId(req.user);
    const assignedEquipmentIds = await getAssignedEquipmentIds(uid);
    where = {
      [Op.or]: [
        { userId: uid },
        ...(assignedEquipmentIds.length > 0
          ? [{ equipmentId: { [Op.in]: assignedEquipmentIds } }]
          : []),
      ],
    };
  }

  const { rows: reports, count: total } = await ServiceReport.findAndCountAll({
    ...(where && { where }),
    include: [
      {
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'serialNumber'],
        include: [
          { model: Client, as: 'client', attributes: ['id', 'name'] }
        ]
      },
      {
        model: User,
        as: 'technician',
        attributes: ['id', 'username', 'email']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  res.status(200).json({
    success: true,
    ...paginatedResponse(reports, total, page, limit)
  });
});

// ─── GET /api/service-reports/:id ────────────────────────────────────────────
const getServiceReportById = asyncHandler(async (req, res) => {
  const report = await getReportById(req.params.id);

  if (!report) {
    const error = new Error('Reporte no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!(await canAccessReport(req.user, report))) {
    throw forbidden();
  }

  const fullReport = await ServiceReport.findByPk(report.id, {
    include: [
      {
        model: Equipment,
        as: 'equipment',
        include: [{ model: Client, as: 'client' }]
      },
      {
        model: User,
        as: 'technician',
        attributes: ['id', 'username', 'email']
      }
    ]
  });

  res.status(200).json({ success: true, data: fullReport });
});

// ─── POST /api/service-reports ────────────────────────────────────────────────
const createServiceReport = asyncHandler(async (req, res) => {
  const {
    equipment_id,
    visit_type,
    system_name,
    report_date,
    water_energy_data,
    motor_1_data,
    motor_2_data,
    motor_3_data,
    control_peripherals_data,
    observations,
    technician_name,
    client_signature_name,
    signature_base64,
    description,
    parts_used,
    recommendations,
    cost
  } = req.body;

  if (!equipment_id) {
    return res.status(400).json({ success: false, message: 'Se requiere seleccionar un equipo' });
  }

  const reportNumber = await generateReportNumber();

  const motorsData = [motor_1_data, motor_2_data, motor_3_data].filter(Boolean);

  const report = await ServiceReport.create({
    reportNumber,
    reportDate: report_date || new Date(),
    visitType: visit_type || 'mensual',
    systemName: system_name || null,
    waterEnergyData: water_energy_data || null,
    motorsData: motorsData.length > 0 ? motorsData : null,
    controlData: control_peripherals_data || null,
    observations: observations || null,
    technicianName: technician_name || req.user?.username || null,
    clientSignatureName: client_signature_name || null,
    clientSignature: signature_base64 || null,
    description: description || observations || 'Reporte de mantenimiento',
    partsUsed: parts_used || null,
    recommendations: recommendations || null,
    cost: cost || 0,
    equipmentId: equipment_id,
    userId: req.user?.userId || req.user?.id || null
  });

  const full = await ServiceReport.findByPk(report.id, {
    include: [
      { model: Equipment, as: 'equipment', include: [{ model: Client, as: 'client' }] },
      { model: User, as: 'technician', attributes: ['id', 'username'] }
    ]
  });

  res.status(201).json({ success: true, data: full });
});

// ─── PUT /api/service-reports/:id ────────────────────────────────────────────
const updateServiceReport = asyncHandler(async (req, res) => {
  const report = await getReportById(req.params.id);

  if (!report) {
    const error = new Error('Reporte no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!(await canAccessReport(req.user, report))) {
    throw forbidden();
  }

  const {
    visit_type, system_name, report_date,
    water_energy_data, motor_1_data, motor_2_data, motor_3_data,
    control_peripherals_data, observations,
    technician_name, client_signature_name,
    description, parts_used, recommendations, cost
  } = req.body;

  const motorsData = [motor_1_data, motor_2_data, motor_3_data].filter(Boolean);

  await report.update({
    ...(visit_type && { visitType: visit_type }),
    ...(system_name !== undefined && { systemName: system_name }),
    ...(report_date && { reportDate: report_date }),
    ...(water_energy_data && { waterEnergyData: water_energy_data }),
    ...(motorsData.length > 0 && { motorsData }),
    ...(control_peripherals_data && { controlData: control_peripherals_data }),
    ...(observations !== undefined && { observations }),
    ...(technician_name && { technicianName: technician_name }),
    ...(client_signature_name && { clientSignatureName: client_signature_name }),
    ...(description && { description }),
    ...(parts_used !== undefined && { partsUsed: parts_used }),
    ...(recommendations !== undefined && { recommendations }),
    ...(cost !== undefined && { cost })
  });

  res.status(200).json({ success: true, data: report });
});

// ─── DELETE /api/service-reports/:id ─────────────────────────────────────────
const deleteServiceReport = asyncHandler(async (req, res) => {
  const report = await getReportById(req.params.id);

  if (!report) {
    const error = new Error('Reporte no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!(await canAccessReport(req.user, report))) {
    throw forbidden();
  }

  await report.destroy();
  res.status(200).json({ success: true, message: 'Reporte eliminado exitosamente' });
});

module.exports = {
  getServiceReports,
  getServiceReportById,
  createServiceReport,
  updateServiceReport,
  deleteServiceReport
};
