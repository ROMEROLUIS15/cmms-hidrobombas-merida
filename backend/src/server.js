const app = require('./app');
require('./models'); // Import models to ensure they are registered with Sequelize before sync
const { initializeDatabase } = require('./config/database');
const { startKeepAlive, stopKeepAlive } = require('./services/neonKeepAlive');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 8001;

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
  if (!process.env.VERCEL) process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message });
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
