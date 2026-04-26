const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').optional(),
  full_name: z.string().trim().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.string().optional()
}).refine(data => data.fullName || data.full_name, {
  message: 'Full name is required',
  path: ['fullName']
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

module.exports = {
  registerSchema,
  loginSchema
};
