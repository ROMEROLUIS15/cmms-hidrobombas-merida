const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize, optional } = require('../middleware/authMiddleware');

jest.mock('jsonwebtoken');
jest.mock('../models/User');

describe('Auth Middleware Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('protect middleware', () => {
    it('should return 401 if no authorization header is provided', async () => {
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Access denied. Authorization token required'
      }));
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic token';
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if token is empty after Bearer', async () => {
      req.headers.authorization = 'Bearer ';
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Access denied. Token not provided'
      }));
    });

    it('should verify token and call next if user exists and is active', async () => {
      req.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ userId: 1, email: 'test@test.com', role: 'admin' });
      User.findOne.mockResolvedValue({ id: 1, isActive: true });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test_secret');
      expect(User.findOne).toHaveBeenCalledWith({
        where: { id: 1, isActive: true }
      });
      expect(req.user).toEqual({ userId: 1, email: 'test@test.com', role: 'admin' });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should return 401 if user does not exist or is deactivated', async () => {
      req.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ userId: 1 });
      User.findOne.mockResolvedValue(null);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token. User not found or deactivated'
      }));
    });

    it('should handle TokenExpiredError', async () => {
      req.headers.authorization = 'Bearer expiredtoken';
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw error; });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token expired'
      }));
    });
    
    it('should handle JsonWebTokenError', async () => {
      req.headers.authorization = 'Bearer invalidtoken';
      const error = new Error('invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw error; });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token format'
      }));
    });

    it('should handle NotBeforeError', async () => {
      req.headers.authorization = 'Bearer notbeforetoken';
      const error = new Error('jwt not active');
      error.name = 'NotBeforeError';
      jwt.verify.mockImplementation(() => { throw error; });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token not active yet'
      }));
    });
  });

  describe('authorize middleware', () => {
    it('should call next if user has required role', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin', 'manager');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should return 401 if req.user is not set', () => {
      const middleware = authorize('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Authentication required'
      }));
    });

    it('should return 403 if user does not have required role', () => {
      req.user = { role: 'user' };
      const middleware = authorize('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Access denied')
      }));
    });
  });

  describe('optional middleware', () => {
    it('should call next without req.user if no token provided', async () => {
      await optional(req, res, next);
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next without req.user if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid';
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
      
      await optional(req, res, next);
      
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should set req.user and call next if token is valid', async () => {
      req.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ userId: 1, email: 't@t.com', role: 'user' });
      User.findOne.mockResolvedValue({ id: 1 });

      await optional(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(1);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
