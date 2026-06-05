const { TechnicianEquipment } = require('../models');

// Roles con acceso total a los recursos (sin restricción de ownership).
const PRIVILEGED_ROLES = ['admin', 'supervisor'];

/**
 * @param {{ role?: string }} user
 * @returns {boolean} true si el usuario puede ver/editar cualquier recurso.
 */
const isPrivileged = (user) => !!user && PRIVILEGED_ROLES.includes(user.role);

/**
 * Normaliza el id del usuario autenticado (el token usa userId; algunos
 * controladores adjuntan también id).
 * @param {{ id?: string, userId?: string }} user
 * @returns {string|null}
 */
const getUserId = (user) => (user ? user.userId || user.id || null : null);

/**
 * Devuelve los ids de equipos asignados a un técnico.
 * @param {string} technicianId
 * @returns {Promise<string[]>}
 */
const getAssignedEquipmentIds = async (technicianId) => {
  if (!technicianId) return [];
  const rows = await TechnicianEquipment.findAll({
    where: { technicianId },
    attributes: ['equipmentId'],
  });
  return rows.map((r) => r.equipmentId);
};

/**
 * Determina si un usuario puede acceder a un reporte concreto.
 * Admin/supervisor: siempre. Técnico: si lo creó o el equipo le está asignado.
 * @param {{ role?: string, id?: string, userId?: string }} user
 * @param {{ userId?: string, equipmentId?: string }} report
 * @returns {Promise<boolean>}
 */
const canAccessReport = async (user, report) => {
  if (isPrivileged(user)) return true;
  if (!report) return false;

  const uid = getUserId(user);
  if (uid && report.userId === uid) return true;

  const assigned = await getAssignedEquipmentIds(uid);
  return assigned.includes(report.equipmentId);
};

module.exports = {
  PRIVILEGED_ROLES,
  isPrivileged,
  getUserId,
  getAssignedEquipmentIds,
  canAccessReport,
};
