const { z } = require('zod');

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
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Se debe proporcionar al menos un campo para actualizar'
});

module.exports = { createEquipmentSchema, updateEquipmentSchema };
