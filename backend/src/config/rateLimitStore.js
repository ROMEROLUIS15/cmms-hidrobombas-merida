const { logger } = require('../utils/logger');

/**
 * Store compartido para express-rate-limit.
 *
 * Por defecto, express-rate-limit usa un MemoryStore en proceso. En un
 * despliegue serverless (Vercel) eso es un problema: cada instancia/lambda tiene
 * su propia memoria y se reinicia en frío, así que el límite real es por-instancia
 * y mucho más débil de lo que sugiere la config. Un store en Redis hace que el
 * conteo sea **global** a todas las instancias.
 *
 * Se activa solo si `REDIS_URL` está definida (p. ej. una URL `rediss://` de
 * Upstash, que funciona bien con clientes serverless). Sin ella, devolvemos
 * `undefined` y express-rate-limit cae a su MemoryStore por defecto — el
 * comportamiento previo, sin romper local/tests/CI.
 */

let client;
let clientResolved = false;

// El cliente Redis es un singleton compartido por los tres limiters; cada limiter
// usa su propio `prefix` para no colisionar en el mismo espacio de claves.
function getClient() {
  if (clientResolved) return client;
  clientResolved = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return client;
  }

  try {
    const Redis = require('ioredis');
    client = new Redis(url, {
      // En serverless interesa fallar rápido y no encolar comandos contra una
      // conexión caída: ante un Redis inaccesible preferimos degradar el rate
      // limiting antes que colgar las peticiones.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.on('error', (e) => logger.error('Redis (rate limit) error', { message: e.message }));
    logger.info('Rate limiting con store compartido en Redis (REDIS_URL configurada)');
  } catch (e) {
    logger.error('No se pudo inicializar ioredis para rate limiting; se usa MemoryStore', { message: e.message });
    client = null;
  }
  return client;
}

/**
 * Devuelve un store de Redis con el prefijo dado, o `undefined` si no hay
 * `REDIS_URL` (en cuyo caso express-rate-limit usa MemoryStore).
 * @param {string} prefix - Prefijo de claves del limiter (p. ej. 'rl:auth:').
 * @returns {import('express-rate-limit').Store | undefined}
 */
function createRateLimitStore(prefix) {
  const c = getClient();
  if (!c) return undefined;

  const { RedisStore } = require('rate-limit-redis');
  return new RedisStore({
    prefix,
    sendCommand: (...args) => c.call(...args),
  });
}

module.exports = { createRateLimitStore };
