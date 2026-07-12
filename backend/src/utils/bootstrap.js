const User = require('../models/User');

/**
 * ¿Existe al menos un administrador utilizable en el sistema?
 *
 * Se exige `isActive: true` a propósito: un admin inactivo no puede iniciar
 * sesión, así que no puede aprobar a nadie. Contarlo como válido dejaría el
 * sistema en el mismo punto muerto que este helper existe para detectar.
 *
 * El punto muerto: el auto-registro (`POST /api/auth/register`) siempre crea
 * técnicos PENDIENTES (`isActive: false`), y solo un admin puede aprobarlos.
 * Con cero admins, cada registro nace bloqueado y no hay quien lo desbloquee.
 * El primer admin se crea fuera de la API, con `backend/bootstrap-admin.js`
 * (requiere acceso a la BD, no basta con alcanzar la web).
 *
 * @returns {Promise<boolean>}
 */
const hasActiveAdmin = async () => {
  const count = await User.count({ where: { role: 'admin', isActive: true } });
  return count > 0;
};

module.exports = { hasActiveAdmin };
