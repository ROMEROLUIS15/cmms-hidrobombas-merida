/** @typedef {import('@langchain/core/tools').DynamicTool} DynamicTool */
/** @typedef {import('sequelize').Op} Op */

const { DynamicTool } = require('@langchain/core/tools');
const { Op } = require('sequelize');
const { Equipment, Client, ServiceReport, User } = require('../models');

const getEquipmentInfo = new DynamicTool({
  name: 'get_equipment_info',
  description:
    'Obtiene información detallada de un equipo por su ID, nombre o número de serie. ' +
    'Útil para conocer especificaciones, estado y cliente asociado.',
  func: async (query) => {
    try {
      const equipment = await Equipment.findAll({
        where: {
          [Op.or]: [
            { id: query },
            { name: { [Op.like]: `%${query}%` } },
            { serialNumber: { [Op.like]: `%${query}%` } },
          ],
        },
        include: [
          { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
          {
            model: ServiceReport,
            as: 'reports',
            attributes: ['id', 'reportNumber', 'reportDate', 'visitType'],
            limit: 5,
            order: [['createdAt', 'DESC']],
          },
        ],
        limit: 5,
      });
      return JSON.stringify(equipment, null, 2);
    } catch (err) {
      return JSON.stringify({ status: 'error', message: `Error obteniendo información del equipo: ${err.message}` });
    }
  },
});

const getClientHistory = new DynamicTool({
  name: 'get_client_history',
  description:
    'Obtiene el historial completo de servicio de un cliente por su nombre o ID. ' +
    'Incluye equipos y reportes de mantenimiento asociados.',
  func: async (query) => {
    try {
      const client = await Client.findOne({
        where: {
          [Op.or]: [
            { id: query },
            { name: { [Op.like]: `%${query}%` } },
          ],
        },
        include: [
          {
            model: Equipment,
            as: 'equipment',
            include: [
              {
                model: ServiceReport,
                as: 'reports',
                limit: 20,
                order: [['createdAt', 'DESC']],
                include: [
                  { model: User, as: 'technician', attributes: ['username'] },
                ],
              },
            ],
          },
        ],
      });
      return JSON.stringify(client, null, 2);
    } catch (err) {
      return JSON.stringify({ status: 'error', message: `Error obteniendo historial del cliente: ${err.message}` });
    }
  },
});

const getRecentReportsByEquipment = new DynamicTool({
  name: 'get_recent_reports_by_equipment',
  description:
    'Obtiene los reportes de servicio más recientes de un equipo por su ID o nombre. ' +
    'Incluye observaciones, recomendaciones y datos técnicos.',
  func: async (query) => {
    try {
      const equipment = await Equipment.findOne({
        where: {
          [Op.or]: [
            { id: query },
            { name: { [Op.like]: `%${query}%` } },
          ],
        },
        include: [
          {
            model: ServiceReport,
            as: 'reports',
            limit: 10,
            order: [['createdAt', 'DESC']],
          },
        ],
      });
      return JSON.stringify(equipment, null, 2);
    } catch (err) {
      return JSON.stringify({ status: 'error', message: `Error obteniendo reportes del equipo: ${err.message}` });
    }
  },
});

const searchReportsByText = new DynamicTool({
  name: 'search_reports_by_text',
  description:
    'Busca reportes de servicio que contengan texto específico en observaciones, ' +
    'recomendaciones o descripción. Útil para encontrar problemas similares.',
  func: async (text) => {
    try {
      const reports = await ServiceReport.findAll({
        where: {
          [Op.or]: [
            { observations: { [Op.like]: `%${text}%` } },
            { recommendations: { [Op.like]: `%${text}%` } },
            { description: { [Op.like]: `%${text}%` } },
            { partsUsed: { [Op.like]: `%${text}%` } },
          ],
        },
        include: [
          { model: Equipment, as: 'equipment', attributes: ['name', 'type'] },
        ],
        limit: 10,
        order: [['createdAt', 'DESC']],
      });
      return JSON.stringify(reports, null, 2);
    } catch (err) {
      return JSON.stringify({ status: 'error', message: `Error buscando reportes: ${err.message}` });
    }
  },
});

module.exports = {
  getEquipmentInfo,
  getClientHistory,
  getRecentReportsByEquipment,
  searchReportsByText,
};
