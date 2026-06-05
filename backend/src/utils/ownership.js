const { TechnicianEquipment, TechnicianClient } = require('../models');

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
 * Devuelve los ids de clientes asignados a un técnico.
 * @param {string} technicianId
 * @returns {Promise<string[]>}
 */
const getAssignedClientIds = async (technicianId) => {
  if (!technicianId) return [];
  const rows = await TechnicianClient.findAll({
    where: { technicianId },
    attributes: ['clientId'],
  });
  return rows.map((r) => r.clientId);
};

/**
 * Determina si un usuario puede acceder a un equipo concreto.
 * Admin/supervisor: siempre. Técnico: si el equipo le está asignado.
 * @param {{ role?: string, id?: string, userId?: string }} user
 * @param {string} equipmentId
 * @returns {Promise<boolean>}
 */
const canAccessEquipment = async (user, equipmentId) => {
  if (isPrivileged(user)) return true;
  if (!equipmentId) return false;
  const assigned = await getAssignedEquipmentIds(getUserId(user));
  return assigned.includes(equipmentId);
};

/**
 * Determina si un usuario puede acceder a un cliente concreto.
 * Admin/supervisor: siempre. Técnico: si el cliente le está asignado.
 * @param {{ role?: string, id?: string, userId?: string }} user
 * @param {string} clientId
 * @returns {Promise<boolean>}
 */
const canAccessClient = async (user, clientId) => {
  if (isPrivileged(user)) return true;
  if (!clientId) return false;
  const assigned = await getAssignedClientIds(getUserId(user));
  return assigned.includes(clientId);
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
  getAssignedClientIds,
  canAccessEquipment,
  canAccessClient,
  canAccessReport,
};
