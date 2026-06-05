const asyncHandler = require('express-async-handler');
const { IdempotencyKey } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');

const idempotencyMiddleware = asyncHandler(async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!idempotencyKey) {
    return next();
  }

  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  const existingKey = await IdempotencyKey.findOne({
    where: {
      key: idempotencyKey,
      path: req.originalUrl,
      method: req.method,
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  if (existingKey) {
    logger.warn('Idempotency: duplicate request blocked', {
      correlationId: req.correlationId,
      idempotencyKey,
    });
    let cachedBody;
    try {
      cachedBody = JSON.parse(existingKey.responseBody);
    } catch {
      return res.status(500).json({ success: false, message: 'Idempotency cache corrupted' });
    }
    return res.status(existingKey.responseStatus).json(cachedBody);
  }

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      IdempotencyKey.create({
        key: idempotencyKey,
        path: req.originalUrl,
        method: req.method,
        responseStatus: res.statusCode,
        responseBody: JSON.stringify(body),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).catch(err => logger.error('Idempotency: error saving key', {
        correlationId: req.correlationId,
        message: err.message,
      }));
    }

    return originalJson(body);
  };

  next();
});

module.exports = { idempotencyMiddleware };