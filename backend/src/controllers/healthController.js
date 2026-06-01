const asyncHandler = require('express-async-handler');
const { manualHealthCheck } = require('../services/neonKeepAlive');

/**
 * GET /api/health
 * Health check público - sin autenticación requerida
 * 
 * Propósitos:
 * - Monitoreo de tiempo de actividad (UptimeRobot, etc.)
 * - Mantener Neon despierto si es llamado regularmente
 * - Verificación básica de servidor
 */
const healthCheck = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  try {
    // Ejecutar health check de BD
    const dbHealthy = await manualHealthCheck();

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      database: {
        status: dbHealthy ? 'connected' : 'degraded',
        dialect: process.env.DATABASE_URL ? 'postgresql' : 'sqlite'
      },
      server: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '2.0.0'
      },
      performance: {
        responseTimeMs: responseTime
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'service_unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = { healthCheck };
