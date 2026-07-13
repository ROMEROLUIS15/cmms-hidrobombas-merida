const { z } = require('zod');
const { EQUIPMENT_STATUSES } = require('../models/Equipment');

// Los estados salen del MODELO, que es la única fuente de verdad y coincide con
// el enum de Postgres. Antes este archivo tenía su propia lista
// (`active`/`inactive`/`maintenance`): rechazaba los estados válidos y dejaba
// pasar valores que la BD no acepta.
const statusSchema = z.enum(EQUIPMENT_STATUSES);

const createEquipmentSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200),
  clientId: z.string().uuid('clientId debe ser un UUID válido'),
  type: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  serialNumber: z.string().trim().max(100).optional(),
  location: z.string().trim().max(300).optional(),
  installationDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  notes: z.string().trim().max(2000).optional(),
  status: statusSchema.optional(),
});

const updateEquipmentSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  serialNumber: z.string().trim().max(100).optional(),
  location: z.string().trim().max(300).optional(),
  installationDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  status: statusSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Se debe proporcionar al menos un campo para actualizar'
});

module.exports = { createEquipmentSchema, updateEquipmentSchema };
