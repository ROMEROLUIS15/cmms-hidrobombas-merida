const { register, login, getProfile } = require('../controllers/authController');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

jest.mock('../models/User');
jest.mock('../utils/jwt');
jest.mock('../utils/cookie', () => ({
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn()
}));

describe('Auth Controller Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully (fullName)', async () => {
      // Arrange
      req.body = { fullName: 'John Doe', email: 'john@example.com', password: 'password', role: 'admin' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 1, email: 'john@example.com', role: 'technician', toJSON: () => ({ id: 1, username: 'John Doe' }) });
      generateToken.mockReturnValue('mockedToken');

      // Act
      await register(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalled();
      // Role is always forced to 'technician' on self-registration regardless of what's sent
      expect(User.create).toHaveBeenCalledWith({
        username: 'John Doe',
        email: 'john@example.com',
        password: 'password',
        role: 'technician'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'mockedToken'
      }));
    });

    it('should default role to technician if not provided', async () => {
      // Arrange
      req.body = { full_name: 'Jane Doe', email: 'jane@example.com', password: 'password' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 2, email: 'jane@example.com', role: 'technician', toJSON: () => ({}) });
      generateToken.mockReturnValue('mockedToken');

      // Act
      await register(req, res);

      // Assert
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        role: 'technician'
      }));
    });

    it('should return 400 if email already exists', async () => {
      // Arrange
      req.body = { fullName: 'John Doe', email: 'john@example.com', password: 'password' };
      User.findOne.mockResolvedValue({ email: 'john@example.com' });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already registered'
      });
      expect(User.create).not.toHaveBeenCalled();
    });
    
    it('should return 400 if username already exists', async () => {
      // Arrange
      req.body = { fullName: 'John Doe', email: 'john2@example.com', password: 'password' };
      User.findOne.mockResolvedValue({ email: 'another@example.com', username: 'John Doe' });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Username already taken'
      });
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Arrange
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

      // Act
      await login(req, res);

      // Assert
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
      // Arrange
      req.body = { email: 'wrong@example.com', password: 'password' };
      User.findOne.mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid email or password' }));
    });

    it('should return 401 if user is deactivated', async () => {
      // Arrange
      req.body = { email: 'john@example.com', password: 'password' };
      User.findOne.mockResolvedValue({ isActive: false });

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account is deactivated' }));
    });

    it('should return 401 if password is incorrect', async () => {
      // Arrange
      req.body = { email: 'john@example.com', password: 'wrong' };
      const mockUser = {
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid email or password' }));
    });
  });

  describe('getProfile', () => {
    it('should return user profile if found', async () => {
      // Arrange
      req.user = { userId: 1 };
      const mockUser = { toJSON: jest.fn().mockReturnValue({ id: 1, name: 'John' }) };
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      await getProfile(req, res);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        user: { id: 1, name: 'John' }
      }));
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.user = { userId: 99 };
      User.findByPk.mockResolvedValue(null);

      // Act
      await getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found'
      }));
    });
  });
});
