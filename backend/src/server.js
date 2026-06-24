const app = require('./app');
require('./models'); // Import models to ensure they are registered with Sequelize before sync
const { initializeDatabase } = require('./config/database');
const { startKeepAlive, stopKeepAlive } = require('./services/neonKeepAlive');
const { logger } = require('./utils/logger');
const { initErrorReporter, reportError } = require('./utils/errorReporter');

const PORT = process.env.PORT || 8001;

// Validación de entorno crítico (fail-fast). Un JWT_SECRET ausente degrada la
// auth de forma silenciosa: jwt firmaría/verificaría con `undefined`. Preferimos
// no arrancar a servir un backend con la autenticación rota.
const validateEnv = () => {
  if (!process.env.JWT_SECRET) {
    const msg = 'JWT_SECRET es obligatoria y está ausente. El backend no puede emitir ni verificar tokens de forma segura.';
    logger.error('Configuración de entorno inválida', { message: msg });
    throw new Error(msg);
  }
  if (process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET es más corta de lo recomendado (<32 caracteres). Usa un secreto largo y aleatorio.');
  }
};

validateEnv();

// Inicializa el reporte de errores externo (Sentry) si está configurado.
initErrorReporter();

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Iniciar servicio de keep-alive para Neon
    startKeepAlive();
    
    if (process.env.VERCEL) {
      // On Vercel, we just need to ensure DB is initialized
      await initializeDatabase();
    } else {
      app.listen(PORT, '0.0.0.0', () => {
        logger.info('Server ready', { port: PORT, env: process.env.NODE_ENV || 'development' });
      });
    }
  } catch (error) {
    logger.error('Failed to start server', { message: error.message });
    if (!process.env.VERCEL) process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
  reportError(reason instanceof Error ? reason : new Error(String(reason)), { type: 'unhandledRejection' });
  if (!process.env.VERCEL) process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message });
  reportError(error, { type: 'uncaughtException' });
  if (!process.env.VERCEL) process.exit(1);
});

// Graceful shutdown - detener keep-alive
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  stopKeepAlive();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  stopKeepAlive();
  process.exit(0);
});

startServer();

module.exports = app;
