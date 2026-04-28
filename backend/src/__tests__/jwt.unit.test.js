const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('JWT Utils Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('generateToken', () => {
    it('should generate a token with the correct payload and options', () => {
      const mockToken = 'mocked.jwt.token';
      jwt.sign.mockReturnValue(mockToken);

      const userId = 1;
      const email = 'test@test.com';
      const role = 'admin';

      const result = generateToken(userId, email, role);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, email, role },
        'test_secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(mockToken);
    });

    it('should use default expiration if JWT_EXPIRES_IN is not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      
      const mockToken = 'mocked.jwt.token';
      jwt.sign.mockReturnValue(mockToken);

      generateToken(1, 'test@test.com', 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: 'test@test.com', role: 'user' },
        'test_secret',
        { expiresIn: '24h' } // Default from jwt.js
      );
    });
  });
});
