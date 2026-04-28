const {
  forgotPassword,
  validateResetToken,
  resetPassword,
  verifyEmail,
  resendVerification
} = require('../controllers/passwordController');
const { User, PasswordResetToken } = require('../models');
const { Op } = require('sequelize');

jest.mock('../models');

describe('Password Controller Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should return 200 with generic message even if user is not found', async () => {
      req.body = { email: 'notfound@example.com' };
      User.findOne.mockResolvedValue(null);

      await forgotPassword(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'notfound@example.com' } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        email_sent: false,
        message: expect.stringContaining('Si ese email está registrado')
      }));
    });

    it('should create a token and return 200 if user is found', async () => {
      req.body = { email: 'found@example.com' };
      User.findOne.mockResolvedValue({ id: 1, email: 'found@example.com' });
      PasswordResetToken.destroy.mockResolvedValue(1);
      PasswordResetToken.create.mockResolvedValue({});

      await forgotPassword(req, res);

      expect(PasswordResetToken.destroy).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(PasswordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({
        token: expect.any(String),
        userId: 1,
        expiresAt: expect.any(Date)
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        email_sent: true
      }));
    });
  });

  describe('validateResetToken', () => {
    it('should return 400 if token is invalid or expired', async () => {
      req.params = { token: 'invalid_token' };
      PasswordResetToken.findOne.mockResolvedValue(null);

      await validateResetToken(req, res);

      expect(PasswordResetToken.findOne).toHaveBeenCalledWith({
        where: {
          token: 'invalid_token',
          expiresAt: { [Op.gt]: expect.any(Date) }
        }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        valid: false
      }));
    });

    it('should return 200 if token is valid', async () => {
      req.params = { token: 'valid_token' };
      PasswordResetToken.findOne.mockResolvedValue({ id: 1 });

      await validateResetToken(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, valid: true });
    });
  });

  describe('resetPassword', () => {
    it('should return 400 if passwords do not match', async () => {
      req.body = { token: 'valid_token', new_password: 'pass1', confirm_password: 'pass2' };

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Las contraseñas no coinciden'
      }));
    });

    it('should return 400 if token is invalid or expired', async () => {
      req.body = { token: 'invalid_token', new_password: 'pass1', confirm_password: 'pass1' };
      PasswordResetToken.findOne.mockResolvedValue(null);

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token inválido o expirado'
      }));
    });

    it('should update password and destroy token if valid', async () => {
      req.body = { token: 'valid_token', new_password: 'pass1', confirm_password: 'pass1' };
      const mockRecord = {
        user: { update: jest.fn().mockResolvedValue() },
        destroy: jest.fn().mockResolvedValue()
      };
      PasswordResetToken.findOne.mockResolvedValue(mockRecord);

      await resetPassword(req, res);

      expect(mockRecord.user.update).toHaveBeenCalledWith({ password: 'pass1' });
      expect(mockRecord.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('verifyEmail', () => {
    it('should return 200', async () => {
      await verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('resendVerification', () => {
    it('should return 200', async () => {
      await resendVerification(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
