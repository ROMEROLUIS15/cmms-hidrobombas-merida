const { register, login, getProfile } = require('../controllers/authController');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

jest.mock('../models/User');
jest.mock('../utils/jwt');

describe('Auth Controller Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully (fullName)', async () => {
      req.body = { fullName: 'John Doe', email: 'john@example.com', password: 'password', role: 'admin' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 1, email: 'john@example.com', role: 'admin', toJSON: () => ({ id: 1, username: 'John Doe' }) });
      generateToken.mockReturnValue('mockedToken');

      await register(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(User.create).toHaveBeenCalledWith({
        username: 'John Doe',
        email: 'john@example.com',
        password: 'password',
        role: 'admin'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'mockedToken'
      }));
    });

    it('should default role to technician if not provided', async () => {
      req.body = { full_name: 'Jane Doe', email: 'jane@example.com', password: 'password' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 2, email: 'jane@example.com', role: 'technician', toJSON: () => ({}) });
      generateToken.mockReturnValue('mockedToken');

      await register(req, res);

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        role: 'technician'
      }));
    });

    it('should return 400 if email already exists', async () => {
      req.body = { fullName: 'John Doe', email: 'john@example.com', password: 'password' };
      User.findOne.mockResolvedValue({ email: 'john@example.com' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already registered'
      });
      expect(User.create).not.toHaveBeenCalled();
    });
    
    it('should return 400 if username already exists', async () => {
      req.body = { fullName: 'John Doe', email: 'john2@example.com', password: 'password' };
      User.findOne.mockResolvedValue({ email: 'another@example.com', username: 'John Doe' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username already taken'
      });
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      req.body = { email: 'john@example.com', password: 'password123' };
      const mockUser = {
        id: 1,
        email: 'john@example.com',
        role: 'admin',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ id: 1, email: 'john@example.com' })
      };
      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mockedToken');

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockUser.update).toHaveBeenCalledWith({ lastLogin: expect.any(Date) });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'mockedToken'
      }));
    });

    it('should return 401 if user not found', async () => {
      req.body = { email: 'wrong@example.com', password: 'password' };
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid email or password' }));
    });

    it('should return 401 if user is deactivated', async () => {
      req.body = { email: 'john@example.com', password: 'password' };
      User.findOne.mockResolvedValue({ isActive: false });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account is deactivated' }));
    });

    it('should return 401 if password is incorrect', async () => {
      req.body = { email: 'john@example.com', password: 'wrong' };
      const mockUser = {
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUser);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid email or password' }));
    });
  });

  describe('getProfile', () => {
    it('should return user profile if found', async () => {
      req.user = { userId: 1 };
      const mockUser = { toJSON: jest.fn().mockReturnValue({ id: 1, name: 'John' }) };
      User.findByPk.mockResolvedValue(mockUser);

      await getProfile(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        user: { id: 1, name: 'John' }
      }));
    });

    it('should return 404 if user not found', async () => {
      req.user = { userId: 99 };
      User.findByPk.mockResolvedValue(null);

      await getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found'
      }));
    });
  });
});
