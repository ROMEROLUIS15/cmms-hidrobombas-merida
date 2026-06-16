const asyncHandler = require('express-async-handler');
const { IdempotencyKey } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

const sendCached = (res, row) => {
  let cachedBody;
  try {
    cachedBody = JSON.parse(row.responseBody);
  } catch {
    return res.status(500).json({ success: false, message: 'Idempotency cache corrupted' });
  }
  return res.status(row.responseStatus).json(cachedBody);
};

const inProgress = (res) =>
  res.status(409).json({ success: false, message: 'Solicitud en proceso, reintente en breve' });

/**
 * Idempotencia para métodos mutadores con cabecera `X-Idempotency-Key`.
 *
 * Estrategia "reservar-antes-de-procesar": la clave se inserta ANTES de ejecutar
 * el handler. El índice único sobre `key` cierra la ventana de carrera del patrón
 * anterior (check-then-act + create fire-and-forget): dos peticiones concurrentes
 * con la misma clave compiten por el INSERT y solo una gana; la otra recibe 409
 * (en vuelo) o la respuesta cacheada si la primera ya terminó.
 */
const idempotencyMiddleware = asyncHandler(async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    return next();
  }

  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  // Limpia reservas expiradas de esta clave para no bloquear reintentos legítimos.
  await IdempotencyKey.destroy({
    where: { key: idempotencyKey, expiresAt: { [Op.lte]: new Date() } },
  });

  // ¿Ya existe una respuesta para esta clave/ruta?
  const existing = await IdempotencyKey.findOne({
    where: {
      key: idempotencyKey,
      path: req.originalUrl,
      method: req.method,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (existing) {
    logger.warn('Idempotency: duplicate request', {
      correlationId: req.correlationId,
      idempotencyKey,
    });
    // Completada → respuesta cacheada. Reservada (sin body) → en vuelo.
    return existing.responseBody !== null ? sendCached(res, existing) : inProgress(res);
  }

  // Reserva atómica de la clave antes de procesar.
  let reserved;
  try {
    reserved = await IdempotencyKey.create({
      key: idempotencyKey,
      path: req.originalUrl,
      method: req.method,
      responseStatus: null,
      responseBody: null,
      expiresAt: new Date(Date.now() + EXPIRY_MS),
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      // Perdió la carrera por el INSERT. Devolver cache si la otra ya terminó.
      const winner = await IdempotencyKey.findOne({ where: { key: idempotencyKey } });
      if (
        winner &&
        winner.responseBody !== null &&
        winner.path === req.originalUrl &&
        winner.method === req.method
      ) {
        return sendCached(res, winner);
      }
      return inProgress(res);
    }
    throw err;
  }

  // Al responder: persistir la respuesta (2xx) o liberar la reserva (no-2xx).
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      reserved
        .update({ responseStatus: res.statusCode, responseBody: JSON.stringify(body) })
        .catch((err) =>
          logger.error('Idempotency: error saving response', {
            correlationId: req.correlationId,
            message: err.message,
          })
        );
    } else {
      // Respuesta de error → liberar para permitir un reintento real.
      reserved.destroy().catch((err) =>
        logger.error('Idempotency: error releasing key', {
          correlationId: req.correlationId,
          message: err.message,
        })
      );
    }

    return originalJson(body);
  };

  next();
});

module.exports = { idempotencyMiddleware };
