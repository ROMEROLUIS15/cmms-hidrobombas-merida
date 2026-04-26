const asyncHandler = require('express-async-handler');
const { ServiceReport, Equipment, Client, User } = require('../models');
const { Op } = require('sequelize');

// ─── Helper: generate sequential report number ────────────────────────────────
const generateReportNumber = async () => {
  const count = await ServiceReport.count();
  const next = String(count + 1).padStart(4, '0');
  return `SRV-${next}`;
};

// ─── GET /api/service-reports ─────────────────────────────────────────────────
const getServiceReports = asyncHandler(async (req, res) => {
  const reports = await ServiceReport.findAll({
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
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({ success: true, data: reports });
});

// ─── GET /api/service-reports/:id ────────────────────────────────────────────
const getServiceReportById = asyncHandler(async (req, res) => {
  const report = await ServiceReport.findByPk(req.params.id, {
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

  if (!report) {
    return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
  }

  res.status(200).json({ success: true, data: report });
});

// ─── POST /api/service-reports ────────────────────────────────────────────────
const createServiceReport = asyncHandler(async (req, res) => {
  const {
    equipment_id,
    client_id,
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
    // legacy fields
    description,
    parts_used,
    recommendations,
    cost
  } = req.body;

  if (!equipment_id) {
    return res.status(400).json({ success: false, message: 'Se requiere seleccionar un equipo' });
  }

  const reportNumber = await generateReportNumber();

  // Consolidate motors data into a single array
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
    // legacy
    description: description || observations || 'Reporte de mantenimiento',
    partsUsed: parts_used || null,
    recommendations: recommendations || null,
    cost: cost || 0,
    equipmentId: equipment_id,
    userId: req.user?.id || null
  });

  // Return with full associations
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
  const report = await ServiceReport.findByPk(req.params.id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
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
  const report = await ServiceReport.findByPk(req.params.id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
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
