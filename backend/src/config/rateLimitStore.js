const { MemoryStore } = require('express-rate-limit');
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
 * Se activa solo si `REDIS_URL` está definida (una URL `rediss://` de Upstash).
 * Sin ella, devolvemos `undefined` y express-rate-limit cae a su MemoryStore.
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
      // `enableOfflineQueue: true` es OBLIGATORIO junto a `lazyConnect`. Con la
      // cola desactivada, el PRIMER comando (el que dispara la conexión perezosa)
      // se rechaza al instante con "Stream isn't writeable and enableOfflineQueue
      // options is false", porque el socket aún no está listo. Eso tumbó
      // producción: 500 en todos los logins. Con la cola activa, los comandos
      // emitidos mientras se conecta esperan en lugar de reventar.
      enableOfflineQueue: true,
      lazyConnect: true,
      // Ante un Redis realmente caído queremos fallar RÁPIDO y degradar el rate
      // limiting, no colgar las peticiones del usuario.
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
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
 * Envuelve el store de Redis para que un fallo suyo NUNCA tumbe la API.
 *
 * express-rate-limit propaga cualquier error del store al middleware de errores:
 * un Redis caído se convertía en **500 en `/api/auth/login`**. El rate limiting
 * es una protección, no una dependencia crítica: si Redis falla, degradamos a un
 * conteo en memoria (por-instancia, más débil pero funcional) en vez de dejar a
 * los usuarios fuera del sistema.
 *
 * @param {import('express-rate-limit').Store} redisStore
 * @param {import('express-rate-limit').Store} fallback
 * @returns {import('express-rate-limit').Store}
 */
function withMemoryFallback(redisStore, fallback) {
  let degraded = false;

  const onFailure = (op, error) => {
    // Ruidoso una sola vez: si Redis está caído, no queremos un log por request.
    if (!degraded) {
      degraded = true;
      logger.error('Redis (rate limit) no disponible; degradando a MemoryStore', {
        op,
        message: error.message,
      });
    }
  };

  return {
    init(options) {
      redisStore.init?.(options);
      fallback.init?.(options);
    },
    async increment(key) {
      try {
        return await redisStore.increment(key);
      } catch (error) {
        onFailure('increment', error);
        return fallback.increment(key);
      }
    },
    async decrement(key) {
      try {
        return await redisStore.decrement(key);
      } catch (error) {
        onFailure('decrement', error);
        return fallback.decrement(key);
      }
    },
    async resetKey(key) {
      try {
        return await redisStore.resetKey(key);
      } catch (error) {
        onFailure('resetKey', error);
        return fallback.resetKey(key);
      }
    },
  };
}

/**
 * Devuelve un store de Redis (con degradación a memoria) o `undefined` si no hay
 * `REDIS_URL`, en cuyo caso express-rate-limit usa su MemoryStore.
 * @param {string} prefix - Prefijo de claves del limiter (p. ej. 'rl:auth:').
 * @returns {import('express-rate-limit').Store | undefined}
 */
function createRateLimitStore(prefix) {
  const c = getClient();
  if (!c) return undefined;

  const { RedisStore } = require('rate-limit-redis');
  const redisStore = new RedisStore({
    prefix,
    sendCommand: (...args) => c.call(...args),
  });

  return withMemoryFallback(redisStore, new MemoryStore());
}

/** Solo para tests: reinicia el singleton del cliente. */
function _resetClientForTests() {
  clientResolved = false;
  client = undefined;
}

module.exports = { createRateLimitStore, withMemoryFallback, _resetClientForTests };
