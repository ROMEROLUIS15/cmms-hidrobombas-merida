const { Op } = require('sequelize');

jest.mock('../models', () => ({
  Equipment: { findAll: jest.fn(), findOne: jest.fn() },
  Client: { findOne: jest.fn() },
  ServiceReport: { findAll: jest.fn() },
  User: {},
}));

const { Equipment, Client, ServiceReport } = require('../models');
const {
  getEquipmentInfo,
  getClientHistory,
  getRecentReportsByEquipment,
  searchReportsByText,
} = require('../ai/tools');

describe('AI Tools Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEquipmentInfo', () => {
    it('should return equipment info as JSON string', async () => {
      const mockEquipment = [{ id: 'eq-1', name: 'Bomba' }];
      Equipment.findAll.mockResolvedValue(mockEquipment);

      const result = await getEquipmentInfo.func('eq-1');

      expect(Equipment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: expect.arrayContaining([
              { id: 'eq-1' },
              { name: { [Op.like]: '%eq-1%' } },
            ]),
          }),
          include: expect.arrayContaining([
            expect.objectContaining({ as: 'client' }),
            expect.objectContaining({ as: 'reports' }),
          ]),
          limit: 5,
        })
      );
      expect(result).toBe(JSON.stringify(mockEquipment, null, 2));
    });

    it('should handle empty results', async () => {
      Equipment.findAll.mockResolvedValue([]);

      const result = await getEquipmentInfo.func('nonexistent');

      expect(result).toBe(JSON.stringify([], null, 2));
    });

    it('should return error message on exception', async () => {
      Equipment.findAll.mockRejectedValue(new Error('DB connection failed'));

      const result = await getEquipmentInfo.func('eq-1');

      expect(JSON.parse(result)).toEqual({ status: 'error', message: 'Error obteniendo información del equipo: DB connection failed' });
    });
  });

  describe('getClientHistory', () => {
    it('should return client history as JSON string', async () => {
      const mockClient = { id: 'client-1', name: 'Test Client', equipment: [] };
      Client.findOne.mockResolvedValue(mockClient);

      const result = await getClientHistory.func('Test Client');

      expect(Client.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: expect.arrayContaining([
              { id: 'Test Client' },
              { name: { [Op.like]: '%Test Client%' } },
            ]),
          }),
          include: expect.arrayContaining([
            expect.objectContaining({ as: 'equipment' }),
          ]),
        })
      );
      expect(result).toBe(JSON.stringify(mockClient, null, 2));
    });

    it('should handle null client (not found)', async () => {
      Client.findOne.mockResolvedValue(null);

      const result = await getClientHistory.func('Unknown');

      expect(result).toBe(JSON.stringify(null, null, 2));
    });

    it('should return error message on exception', async () => {
      Client.findOne.mockRejectedValue(new Error('Query timeout'));

      const result = await getClientHistory.func('Client');

      expect(JSON.parse(result)).toEqual({ status: 'error', message: 'Error obteniendo historial del cliente: Query timeout' });
    });
  });

  describe('getRecentReportsByEquipment', () => {
    it('should return reports as JSON string', async () => {
      const mockEquipment = { id: 'eq-1', name: 'Pump', reports: [] };
      Equipment.findOne.mockResolvedValue(mockEquipment);

      const result = await getRecentReportsByEquipment.func('Pump');

      expect(Equipment.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: expect.arrayContaining([
              { id: 'Pump' },
              { name: { [Op.like]: '%Pump%' } },
            ]),
          }),
          include: expect.arrayContaining([
            expect.objectContaining({
              as: 'reports',
              limit: 10,
              order: [['createdAt', 'DESC']],
            }),
          ]),
        })
      );
      expect(result).toBe(JSON.stringify(mockEquipment, null, 2));
    });

    it('should handle null equipment', async () => {
      Equipment.findOne.mockResolvedValue(null);

      const result = await getRecentReportsByEquipment.func('Missing');

      expect(result).toBe(JSON.stringify(null, null, 2));
    });

    it('should return error message on exception', async () => {
      Equipment.findOne.mockRejectedValue(new Error('Not found'));

      const result = await getRecentReportsByEquipment.func('X');

      expect(JSON.parse(result)).toEqual({ status: 'error', message: 'Error obteniendo reportes del equipo: Not found' });
    });
  });

  describe('searchReportsByText', () => {
    it('should search reports by text in observations, recommendations, description, and partsUsed', async () => {
      const mockReports = [{ id: 'r1', description: 'Overheating motor', equipment: { name: 'Motor', type: 'Eléctrico' } }];
      ServiceReport.findAll.mockResolvedValue(mockReports);

      const result = await searchReportsByText.func('overheating');

      expect(ServiceReport.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: [
              { observations: { [Op.like]: '%overheating%' } },
              { recommendations: { [Op.like]: '%overheating%' } },
              { description: { [Op.like]: '%overheating%' } },
              { partsUsed: { [Op.like]: '%overheating%' } },
            ],
          }),
          include: expect.arrayContaining([
            expect.objectContaining({ as: 'equipment' }),
          ]),
          limit: 10,
          order: [['createdAt', 'DESC']],
        })
      );
      expect(result).toBe(JSON.stringify(mockReports, null, 2));
    });

    it('should return empty array as JSON when no match', async () => {
      ServiceReport.findAll.mockResolvedValue([]);

      const result = await searchReportsByText.func('zzz_nonexistent_zzz');

      expect(result).toBe(JSON.stringify([], null, 2));
    });

    it('should return error message on exception', async () => {
      ServiceReport.findAll.mockRejectedValue(new Error('DB error'));

      const result = await searchReportsByText.func('test');

      expect(JSON.parse(result)).toEqual({ status: 'error', message: 'Error buscando reportes: DB error' });
    });
  });
});
