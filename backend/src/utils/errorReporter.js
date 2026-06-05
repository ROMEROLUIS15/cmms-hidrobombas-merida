const { logger } = require('./logger');

/**
 * Reporte de errores a un servicio externo (Sentry), desacoplado del resto del
 * código. `@sentry/node` es OPCIONAL: si no está instalado o no hay SENTRY_DSN,
 * el reporter queda deshabilitado (no-op) y los errores siguen registrándose
 * por el logger. Para activarlo:  npm install @sentry/node  + SENTRY_DSN.
 */

let sentry = null;
let initialized = false;

/**
 * Inicializa el reporter una sola vez. Seguro de llamar siempre.
 */
function initErrorReporter() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    });
    sentry = Sentry;
    logger.info('Error reporter initialized', { provider: 'sentry' });
  } catch {
    logger.warn(
      'SENTRY_DSN definido pero @sentry/node no está instalado; ' +
      'reporte externo deshabilitado. Ejecuta: npm install @sentry/node'
    );
  }
}

/**
 * Reporta un error al servicio externo si está habilitado.
 * @param {Error} error
 * @param {Record<string, unknown>} [context]
 * @returns {boolean} true si se reportó externamente.
 */
function reportError(error, context = {}) {
  if (!sentry) return false;
  try {
    sentry.captureException(error, { extra: context });
    return true;
  } catch {
    return false;
  }
}

/** @returns {boolean} si el reporte externo está activo. */
function isEnabled() {
  return !!sentry;
}

/** Solo para tests: restablece el estado interno. */
function _reset() {
  sentry = null;
  initialized = false;
}

module.exports = { initErrorReporter, reportError, isEnabled, _reset };
