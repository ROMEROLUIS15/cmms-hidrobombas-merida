/**
 * 🔄 Neon Keep-Alive Service
 *
 * Mantiene la conexión de Neon despierta ejecutando queries simples
 * cada X minutos para evitar que cierre la conexión inactiva.
 *
 * Neon cierra conexiones después de ~15 minutos de inactividad en el plan gratuito.
 */

const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');

// ─── Configuration ───────────────────────────────────────────────────────────
const KEEP_ALIVE_INTERVAL = process.env.NEON_KEEP_ALIVE_INTERVAL || 10 * 60 * 1000; // 10 minutos (default)
const KEEP_ALIVE_ENABLED = process.env.NEON_KEEP_ALIVE_ENABLED !== 'false'; // default: true

let keepAliveInterval = null;

/**
 * Ejecuta un health check simple en la BD
 * Esto mantiene la conexión activa sin afectar datos
 */
const executeHealthCheck = async () => {
  try {
    // Query simple que no afecta nada
    await sequelize.query('SELECT 1 as health_check;');
    
    logger.info('Neon Keep-Alive: connection refreshed');

    return true;
  } catch (error) {
    logger.warn('Neon Keep-Alive failed', { message: error.message });
    return false;
  }
};

/**
 * Inicia el servicio de keep-alive
 * Se ejecuta automáticamente cuando la BD está disponible
 */
const startKeepAlive = () => {
  // Solo iniciar si:
  // 1. Keep-alive está habilitado en config
  // 2. Estamos usando PostgreSQL (no SQLite)
  const isPostgres = sequelize.options.dialect === 'postgres';
  
  if (!KEEP_ALIVE_ENABLED || !isPostgres) {
    if (!isPostgres) {
      logger.info('Neon Keep-Alive: disabled (using SQLite)');
    }
    return;
  }

  logger.info('Neon Keep-Alive: starting', {
    intervalMinutes: KEEP_ALIVE_INTERVAL / 1000 / 60,
  });

  // Ejecutar health check inmediatamente al iniciar
  executeHealthCheck();

  // Luego, ejecutar cada X minutos
  keepAliveInterval = setInterval(executeHealthCheck, KEEP_ALIVE_INTERVAL);
};

/**
 * Detiene el servicio de keep-alive
 * Útil para cleanup al cerrar el servidor
 */
const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    logger.info('Neon Keep-Alive: stopped');
  }
};

/**
 * Health check manual
 * Puede ser llamado desde un endpoint o manualmente
 */
const manualHealthCheck = async () => {
  return executeHealthCheck();
};

module.exports = {
  startKeepAlive,
  stopKeepAlive,
  manualHealthCheck,
  KEEP_ALIVE_INTERVAL
};
