const { Op } = require('sequelize');
// Se requiere el modelo directamente (no el índice de models) para no disparar
// las asociaciones cuando algún test mockea modelos individuales.
const RevokedToken = require('../models/RevokedToken');

/**
 * Revoca un refresh token añadiendo su `jti` a la denylist.
 * Idempotente: si ya está revocado, no falla.
 * @param {string} jti - Identificador único del token.
 * @param {number} [expSeconds] - `exp` del token (epoch en segundos) para fijar
 *   cuándo puede purgarse la entrada. Por defecto, 7 días.
 */
const revokeToken = async (jti, expSeconds) => {
  if (!jti) return;
  const expiresAt = expSeconds
    ? new Date(expSeconds * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RevokedToken.findOrCreate({
    where: { jti },
    defaults: { jti, expiresAt },
  });
};

/**
 * Indica si un refresh token está revocado.
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
const isTokenRevoked = async (jti) => {
  if (!jti) return false;
  const found = await RevokedToken.findOne({ where: { jti } });
  return !!found;
};

/**
 * Purga entradas ya expiradas de la denylist (mantenimiento opcional).
 * @returns {Promise<number>} número de filas eliminadas.
 */
const purgeExpiredRevokedTokens = async () => {
  return RevokedToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
};

module.exports = { revokeToken, isTokenRevoked, purgeExpiredRevokedTokens };
