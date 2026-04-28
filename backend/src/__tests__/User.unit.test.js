const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sequelize } = require('../config/database');

describe('User Model Unit Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });


  afterEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('User Schema', () => {
    it('should have correct fields defined', () => {
      const attributes = User.rawAttributes;
      expect(attributes).toHaveProperty('id');
      expect(attributes).toHaveProperty('username');
      expect(attributes).toHaveProperty('email');
      expect(attributes).toHaveProperty('password');
      expect(attributes).toHaveProperty('role');
      expect(attributes).toHaveProperty('isActive');
      expect(attributes).toHaveProperty('lastLogin');
      expect(attributes).toHaveProperty('googleId');
    });

    it('should have correct default role of technician', () => {
      const roleAttr = User.rawAttributes.role;
      expect(roleAttr.defaultValue).toBe('technician');
    });

    it('should have correct default value for isActive', () => {
      const isActiveAttr = User.rawAttributes.isActive;
      expect(isActiveAttr.defaultValue).toBe(true);
    });
  });

  describe('beforeSave hook - password hashing', () => {
    it('should hash the password before creating a user', async () => {
      const plainPassword = 'mySecurePassword123';

      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword,
        role: 'admin'
      });

      // The stored password should NOT be the plain text
      expect(user.password).not.toBe(plainPassword);
      // It should be a valid bcrypt hash
      const isValid = await bcrypt.compare(plainPassword, user.password);
      expect(isValid).toBe(true);
    });

    it('should re-hash password when it is changed', async () => {
      const user = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'originalPassword',
        role: 'admin'
      });

      const originalHash = user.password;
      user.password = 'newPassword456';
      await user.save();

      expect(user.password).not.toBe(originalHash);
      const isValid = await bcrypt.compare('newPassword456', user.password);
      expect(isValid).toBe(true);
    });

    it('should NOT re-hash if password field was not changed', async () => {
      const user = await User.create({
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'stablePassword',
        role: 'admin'
      });

      const hashAfterCreate = user.password;
      user.username = 'updatedUsername';
      await user.save();

      // Password hash should remain the same since password wasn't changed
      expect(user.password).toBe(hashAfterCreate);
    });
  });

  describe('comparePassword instance method', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'correctPassword123';
      const user = await User.create({
        username: 'compareUser',
        email: 'compare@example.com',
        password: plainPassword,
        role: 'admin'
      });

      const result = await user.comparePassword(plainPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        username: 'compareUser2',
        email: 'compare2@example.com',
        password: 'realPassword',
        role: 'admin'
      });

      const result = await user.comparePassword('wrongPassword');
      expect(result).toBe(false);
    });
  });

  describe('toJSON instance method', () => {
    it('should exclude password and googleId from JSON output', async () => {
      const user = await User.create({
        username: 'jsonUser',
        email: 'json@example.com',
        password: 'jsonPassword',
        role: 'admin',
        googleId: 'google-id-123'
      });

      const json = user.toJSON();
      expect(json).not.toHaveProperty('password');
      expect(json).not.toHaveProperty('googleId');
      expect(json).toHaveProperty('username');
      expect(json).toHaveProperty('email');
    });
  });

  describe('Validations', () => {
    it('should fail if email is not unique', async () => {
      await User.create({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'pass1234',
        role: 'admin'
      });

      await expect(User.create({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'pass5678',
        role: 'admin'
      })).rejects.toThrow();
    });

    it('should fail if username is missing', async () => {
      await expect(User.create({
        email: 'nouser@example.com',
        password: 'pass1234',
        role: 'admin'
      })).rejects.toThrow();
    });
  });
});
