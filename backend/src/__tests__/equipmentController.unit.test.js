const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');
const { Equipment, Client, ServiceReport } = require('../models');

jest.mock('../models');

describe('Equipment Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getEquipment', () => {
    it('should return all equipment when no clientId is provided', async () => {
      Equipment.findAll.mockResolvedValue([{ id: 1, name: 'Eq 1' }]);

      await getEquipment(req, res);

      expect(Equipment.findAll).toHaveBeenCalledWith({
        where: {},
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
        order: [['name', 'ASC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, name: 'Eq 1' }] });
    });

    it('should filter by clientId when provided', async () => {
      req.query = { clientId: 'client-123' };
      Equipment.findAll.mockResolvedValue([{ id: 2, name: 'Eq 2' }]);

      await getEquipment(req, res);

      expect(Equipment.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { clientId: 'client-123' }
      }));
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment if found', async () => {
      req.params = { id: 1 };
      Equipment.findByPk.mockResolvedValue({ id: 1, name: 'Eq 1' });

      await getEquipmentById(req, res);

      expect(Equipment.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, name: 'Eq 1' } });
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 99 };
      Equipment.findByPk.mockResolvedValue(null);

      await getEquipmentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('createEquipment', () => {
    it('should return 400 if name or clientId are missing', async () => {
      req.body = { type: 'Pump' }; // Missing name, clientId

      await createEquipment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should create equipment successfully', async () => {
      req.body = { name: 'Pump A', clientId: 'client-1' };
      Equipment.create.mockResolvedValue({ id: 1, name: 'Pump A' });

      await createEquipment(req, res);

      expect(Equipment.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Pump A',
        clientId: 'client-1'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateEquipment', () => {
    it('should return 404 if not found', async () => {
      req.params = { id: 99 };
      Equipment.findByPk.mockResolvedValue(null);

      await updateEquipment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update equipment if found', async () => {
      req.params = { id: 1 };
      req.body = { name: 'Pump B' };
      const mockEq = { update: jest.fn().mockResolvedValue() };
      Equipment.findByPk.mockResolvedValue(mockEq);

      await updateEquipment(req, res);

      expect(mockEq.update).toHaveBeenCalledWith({ name: 'Pump B' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('deleteEquipment', () => {
    it('should return 404 if not found', async () => {
      req.params = { id: 99 };
      Equipment.findByPk.mockResolvedValue(null);

      await deleteEquipment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete equipment if found', async () => {
      req.params = { id: 1 };
      const mockEq = { destroy: jest.fn().mockResolvedValue() };
      Equipment.findByPk.mockResolvedValue(mockEq);

      await deleteEquipment(req, res);

      expect(mockEq.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
