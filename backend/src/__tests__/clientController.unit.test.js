const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { Client, Equipment } = require('../models');

jest.mock('../models');

describe('Client Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getClients', () => {
    it('should return all clients', async () => {
      Client.findAll.mockResolvedValue([{ id: 1, name: 'Client A' }]);

      await getClients(req, res);

      expect(Client.findAll).toHaveBeenCalledWith({ order: [['name', 'ASC']] });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, name: 'Client A' }] });
    });
  });

  describe('getClientById', () => {
    it('should return client if found', async () => {
      req.params = { id: 1 };
      Client.findByPk.mockResolvedValue({ id: 1, name: 'Client A' });

      await getClientById(req, res);

      expect(Client.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if client not found', async () => {
      req.params = { id: 99 };
      Client.findByPk.mockResolvedValue(null);

      await getClientById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('createClient', () => {
    it('should return 400 if name is missing', async () => {
      req.body = { email: 'client@example.com' };

      await createClient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should create client successfully', async () => {
      req.body = { name: 'Client A', email: 'client@example.com' };
      Client.create.mockResolvedValue({ id: 1, name: 'Client A' });

      await createClient(req, res);

      expect(Client.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Client A' }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updateClient', () => {
    it('should return 404 if not found', async () => {
      req.params = { id: 99 };
      Client.findByPk.mockResolvedValue(null);

      await updateClient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update client if found', async () => {
      req.params = { id: 1 };
      req.body = { name: 'Client B' };
      const mockClient = { update: jest.fn().mockResolvedValue() };
      Client.findByPk.mockResolvedValue(mockClient);

      await updateClient(req, res);

      expect(mockClient.update).toHaveBeenCalledWith({ name: 'Client B' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('deleteClient', () => {
    it('should return 404 if not found', async () => {
      req.params = { id: 99 };
      Client.findByPk.mockResolvedValue(null);

      await deleteClient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete client if found', async () => {
      req.params = { id: 1 };
      const mockClient = { destroy: jest.fn().mockResolvedValue() };
      Client.findByPk.mockResolvedValue(mockClient);

      await deleteClient(req, res);

      expect(mockClient.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});