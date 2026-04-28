const { z } = require('zod');

/**
 * Middleware genérico para validar peticiones usando Zod.
 * @param {z.ZodSchema} schema - El esquema Zod a validar contra req.body
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Intentamos validar los datos
      const parsedData = schema.parse(req.body);
      // Opcional: Reemplazar el body con los datos parseados (limpia campos no definidos en el esquema)
      req.body = parsedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

module.exports = {
  validateRequest
};
