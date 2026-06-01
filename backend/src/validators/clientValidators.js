const { z } = require('zod');

const createClientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200),
  email: z.string().email('Email inválido').toLowerCase().optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  contactPerson: z.string().trim().max(200).optional(),
  rif: z.string().trim().max(20).optional(),
});

const updateClientSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().email('Email inválido').toLowerCase().optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  contactPerson: z.string().trim().max(200).optional(),
  rif: z.string().trim().max(20).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Se debe proporcionar al menos un campo para actualizar'
});

module.exports = { createClientSchema, updateClientSchema };
