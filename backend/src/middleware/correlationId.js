const crypto = require('crypto');

const HEADER = 'X-Correlation-Id';

/**
 * Middleware de correlation ID.
 * Reutiliza el id que envíe el cliente (header X-Correlation-Id o X-Request-Id)
 * o genera uno nuevo. Lo expone en req.correlationId y lo devuelve en la
 * respuesta para poder correlacionar logs frontend↔backend.
 */
const correlationId = (req, res, next) => {
  const incoming = req.get(HEADER) || req.get('X-Request-Id');
  const id = (incoming && String(incoming).slice(0, 128)) || crypto.randomUUID();

  req.correlationId = id;
  res.setHeader(HEADER, id);
  next();
};

module.exports = { correlationId, CORRELATION_HEADER: HEADER };
