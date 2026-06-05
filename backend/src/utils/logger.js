/**
 * Logger estructurado mínimo, sin dependencias.
 *
 * - En producción emite JSON por línea (apto para agregadores de logs).
 * - En desarrollo emite texto legible.
 * - En test queda en silencio (salvo LOG_LEVEL explícito) para no ensuciar la salida.
 *
 * Niveles: debug < info < warn < error. Se controla con LOG_LEVEL.
 * Es el único módulo autorizado a llamar a console directamente.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const defaultLevel = () => {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  if (process.env.NODE_ENV === 'test') return 'silent';
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
};

const threshold = () => LEVELS[defaultLevel()] ?? LEVELS.info;

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {Record<string, unknown>} [meta]
 */
function emit(level, message, meta = {}) {
  if (LEVELS[level] < threshold()) return;

  const sink = level === 'error' ? console.error : console.warn;

  if (isProduction()) {
    sink(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }));
    return;
  }

  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  sink(`[${level.toUpperCase()}] ${message}${metaStr}`);
}

const logger = {
  debug: (message, meta) => emit('debug', message, meta),
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),

  /**
   * Devuelve un logger hijo que añade `bindings` (p. ej. { correlationId }) a
   * cada entrada.
   * @param {Record<string, unknown>} bindings
   */
  child(bindings = {}) {
    return {
      debug: (message, meta) => emit('debug', message, { ...bindings, ...meta }),
      info: (message, meta) => emit('info', message, { ...bindings, ...meta }),
      warn: (message, meta) => emit('warn', message, { ...bindings, ...meta }),
      error: (message, meta) => emit('error', message, { ...bindings, ...meta }),
    };
  },
};

module.exports = { logger, LEVELS };
