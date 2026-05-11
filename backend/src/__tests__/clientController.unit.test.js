const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { Client, Equipment } = require('../models');

jest.mock('../models');
jest.mock('../utils/pagination', () => ({
  getPaginationParams: jest.fn(() => ({ page: 1, limit: 10, offset: 0 })),
  paginatedResponse: jest.fn((data, total, page, limit) => ({ data, pagination: { total, page, limit } }))
}));

describe('Client Controller Unit Tests', () => {
  let req, res, next;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getClients', () => {
    it('should return all clients', async () => {
      Client.findAndCountAll.mockResolvedValue({
        rows: [{ id: validUUID, name: 'Client A' }],
        count: 1
      });

      await getClients(req, res);

      expect(Client.findAndCountAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getClientById', () => {
    it('should return client if found', async () => {
      req.params = { id: validUUID };
      Client.findByPk.mockResolvedValue({ id: validUUID, name: 'Client A' });

      await getClientById(req, res, next);

      expect(Client.findByPk).toHaveBeenCalledWith(validUUID, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error if client not found', async () => {
      req.params = { id: validUUID };
      Client.findByPk.mockResolvedValue(null);

      await getClientById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cliente no encontrado', statusCode: 404 }));
    });

    it('should call next with error for invalid UUID format', async () => {
      req.params = { id: '999' };

      await getClientById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cliente no encontrado', statusCode: 404 }));
    });
  });

  describe('createClient', () => {
    it('should return 400 if name is missing', async () => {
      req.body = { email: 'client@example.com' };

      await createClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should create client successfully', async () => {
      req.body = { name: 'Client A', email: 'client@example.com' };
      Client.create.mockResolvedValue({ id: validUUID, name: 'Client A' });

      await createClient(req, res, next);

      expect(Client.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Client A' }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateClient', () => {
    it('should call next with error if not found', async () => {
      req.params = { id: validUUID };
      Client.findByPk.mockResolvedValue(null);

      await updateClient(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cliente no encontrado', statusCode: 404 }));
    });

    it('should update client if found', async () => {
      req.params = { id: validUUID };
      req.body = { name: 'Client B' };
      const mockClient = { update: jest.fn().mockResolvedValue() };
      Client.findByPk.mockResolvedValue(mockClient);

      await updateClient(req, res, next);

      expect(mockClient.update).toHaveBeenCalledWith({ name: 'Client B' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error for invalid UUID format', async () => {
      req.params = { id: '999' };

      await updateClient(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cliente no encontrado', statusCode: 404 }));
    });
  });

  describe('deleteClient', () => {
    it('should call next with error if not found', async () => {
      req.params = { id: validUUID };
      Client.findByPk.mockResolvedValue(null);

      await deleteClient(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cliente no encontrado', statusCode: 404 }));
    });

    it('should delete client if found', async () => {
      req.params = { id: validUUID };
      const mockClient = { destroy: jest.fn().mockResolvedValue() };
      Client.findByPk.mockResolvedValue(mockClient);

      await deleteClient(req, res, next);

      expect(mockClient.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next with error for invalid UUID format', async () => {
      req.params = { id: '999' };

      await deleteClient(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cliente no encontrado', statusCode: 404 }));
    });
  });
});