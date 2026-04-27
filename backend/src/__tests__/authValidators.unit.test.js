const { registerSchema, loginSchema } = require('../validators/authValidators');

describe('Auth Validators Unit Tests', () => {
  describe('registerSchema', () => {
    it('should validate correctly with valid data (using fullName)', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate correctly with valid data (using full_name)', () => {
      const validData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if neither fullName nor full_name is provided', () => {
      const invalidData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Full name is required');
    });

    it('should fail with invalid email', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Invalid email format');
    });

    it('should fail if password is less than 8 characters', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'short'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters long');
    });
  });

  describe('loginSchema', () => {
    it('should validate correctly with valid data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Invalid email format');
    });

    it('should fail if password is empty', () => {
      const invalidData = {
        email: 'john@example.com',
        password: ''
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Password is required');
    });
  });
});
