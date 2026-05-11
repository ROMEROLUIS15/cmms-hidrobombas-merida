const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');
const { Equipment, Client, ServiceReport } = require('../models');

jest.mock('../models');
jest.mock('../utils/pagination', () => ({
  getPaginationParams: jest.fn(() => ({ page: 1, limit: 10, offset: 0 })),
  paginatedResponse: jest.fn((data, total, page, limit) => ({ data, pagination: { total, page, limit } }))
}));

describe('Equipment Controller Unit Tests', () => {
  let req, res, next;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getEquipment', () => {
    it('should return all equipment when no clientId is provided', async () => {
      Equipment.findAndCountAll.mockResolvedValue({
        rows: [{ id: validUUID, name: 'Eq 1' }],
        count: 1
      });

      await getEquipment(req, res);

      expect(Equipment.findAndCountAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should filter by clientId when provided', async () => {
      req.query = { clientId: validUUID };
      Equipment.findAndCountAll.mockResolvedValue({
        rows: [{ id: validUUID, name: 'Eq 2' }],
        count: 1
      });

      await getEquipment(req, res);

      expect(Equipment.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { clientId: validUUID }
      }));
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment if found', async () => {
      req.params = { id: validUUID };
      Equipment.findByPk.mockResolvedValue({ id: validUUID, name: 'Eq 1' });

      await getEquipmentById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: validUUID, name: 'Eq 1' } }));
    });

    it('should call next with error if not found', async () => {
      req.params = { id: validUUID };
      Equipment.findByPk.mockResolvedValue(null);

      await getEquipmentById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Equipo no encontrado', statusCode: 404 }));
    });

    it('should call next with error for invalid UUID', async () => {
      req.params = { id: '999' };

      await getEquipmentById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Equipo no encontrado', statusCode: 404 }));
    });
  });

  describe('createEquipment', () => {
    it('should return 400 if name or clientId are missing', async () => {
      req.body = { type: 'Pump' };

      await createEquipment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should create equipment successfully', async () => {
      req.body = { name: 'Pump A', clientId: validUUID };
      Equipment.create.mockResolvedValue({ id: validUUID, name: 'Pump A' });

      await createEquipment(req, res, next);

      expect(Equipment.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Pump A',
        clientId: validUUID
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateEquipment', () => {
    it('should call next with error if not found', async () => {
      req.params = { id: validUUID };
      Equipment.findByPk.mockResolvedValue(null);

      await updateEquipment(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Equipo no encontrado', statusCode: 404 }));
    });

    it('should update equipment if found', async () => {
      req.params = { id: validUUID };
      req.body = { name: 'Pump B' };
      const mockEq = { update: jest.fn().mockResolvedValue() };
      Equipment.findByPk.mockResolvedValue(mockEq);

      await updateEquipment(req, res, next);

      expect(mockEq.update).toHaveBeenCalledWith({ name: 'Pump B' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error for invalid UUID', async () => {
      req.params = { id: '999' };

      await updateEquipment(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Equipo no encontrado', statusCode: 404 }));
    });
  });

  describe('deleteEquipment', () => {
    it('should call next with error if not found', async () => {
      req.params = { id: validUUID };
      Equipment.findByPk.mockResolvedValue(null);

      await deleteEquipment(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Equipo no encontrado', statusCode: 404 }));
    });

    it('should delete equipment if found', async () => {
      req.params = { id: validUUID };
      const mockEq = { destroy: jest.fn().mockResolvedValue() };
      Equipment.findByPk.mockResolvedValue(mockEq);

      await deleteEquipment(req, res, next);

      expect(mockEq.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error for invalid UUID', async () => {
      req.params = { id: '999' };

      await deleteEquipment(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Equipo no encontrado', statusCode: 404 }));
    });
  });
});