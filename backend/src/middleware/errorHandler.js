const { logger } = require('../utils/logger');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;
  // Solo registramos como error real los 5xx; los 4xx son flujo esperado.
  if (statusCode >= 500) {
    logger.error('Unhandled error', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      message: error.message,
      stack: error.stack,
    });
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Handle unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Data conflicts with an existing record',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Generic Error Fallback
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    ...(req.correlationId && { correlationId: req.correlationId }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = { errorHandler };
