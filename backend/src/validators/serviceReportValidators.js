const { z } = require('zod');

/**
 * serviceReportValidators — usa snake_case para coincidir con el contrato
 * del serviceReportController y del frontend (ServiceWizard).
 * La validación de negocio (ej: equipment_id requerido) la maneja el controller.
 * Zod valida tipos y longitudes máximas; los campos JSON se validan como z.any()
 * para compatibilidad con Zod v4.
 */

const createServiceReportSchema = z.object({
  equipment_id: z.string().uuid('equipment_id debe ser un UUID válido').optional(),
  visit_type: z.string().trim().max(50).optional(),
  system_name: z.string().trim().max(200).optional(),
  report_date: z.string().optional(),
  technician_name: z.string().trim().max(200).optional(),
  client_signature_name: z.string().trim().max(200).optional(),
  observations: z.string().trim().max(5000).optional(),
  recommendations: z.string().trim().max(5000).optional(),
  description: z.string().trim().max(5000).optional(),
  parts_used: z.string().trim().max(2000).optional(),
  cost: z.number().nonnegative().optional(),
  // JSON fields — z.any() para compatibilidad con Zod v4 (z.record requiere 2 args)
  water_energy_data: z.any().optional(),
  motor_1_data: z.any().optional(),
  motor_2_data: z.any().optional(),
  motor_3_data: z.any().optional(),
  control_peripherals_data: z.any().optional(),
  signature_base64: z.string().optional(),
});

const updateServiceReportSchema = z.object({
  visit_type: z.string().trim().max(50).optional(),
  system_name: z.string().trim().max(200).optional(),
  report_date: z.string().optional(),
  technician_name: z.string().trim().max(200).optional(),
  observations: z.string().trim().max(5000).optional(),
  recommendations: z.string().trim().max(5000).optional(),
  description: z.string().trim().max(5000).optional(),
  parts_used: z.string().trim().max(2000).optional(),
  cost: z.number().nonnegative().optional(),
  water_energy_data: z.any().optional(),
  motors_data: z.any().optional(),
  control_data: z.any().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
});

module.exports = { createServiceReportSchema, updateServiceReportSchema };
