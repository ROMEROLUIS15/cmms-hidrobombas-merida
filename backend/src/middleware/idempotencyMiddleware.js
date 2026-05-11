const asyncHandler = require('express-async-handler');
const { IdempotencyKey } = require('../models');
const { Op } = require('sequelize');

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
    console.warn(`[Idempotency] Duplicate request blocked: ${idempotencyKey}`);
    return res.status(existingKey.responseStatus).json(
      JSON.parse(existingKey.responseBody)
    );
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
      }).catch(err => console.error('Error saving idempotency key:', err));
    }

    return originalJson(body);
  };

  next();
});

module.exports = { idempotencyMiddleware };