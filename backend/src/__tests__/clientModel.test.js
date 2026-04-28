const Client = require('../models/Client');

describe('Client Model', () => {
  describe('Client Schema', () => {
    it('should have the correct fields defined', () => {
      const schema = Client.rawAttributes;
      
      expect(schema).toHaveProperty('id');
      expect(schema).toHaveProperty('name');
      expect(schema).toHaveProperty('email');
      expect(schema).toHaveProperty('phone');
      expect(schema).toHaveProperty('address');
      expect(schema).toHaveProperty('isActive');
    });

    it('should have correct field types', () => {
      const schema = Client.rawAttributes;
      
      expect(schema.id.type.toString()).toContain('UUID');
      expect(schema.name.type.toString()).toContain('VARCHAR');
      expect(schema.email.type.toString()).toContain('VARCHAR');
      expect(schema.phone.type.toString()).toContain('VARCHAR');
      expect(schema.address.type.toString()).toContain('TEXT');
      // In SQLite, BOOLEAN is represented as TINYINT(1)
      const isActiveType = schema.isActive.type.toString();
      expect(isActiveType).toMatch(/BOOLEAN|TINYINT/);
    });

    it('should have correct validations for name field', () => {
      const schema = Client.rawAttributes;
      
      expect(schema.name.allowNull).toBe(false);
      expect(schema.name.validate.notEmpty).toBe(true);
    });

    it('should have correct validations for email field', () => {
      const schema = Client.rawAttributes;
      
      expect(schema.email.validate.isEmail).toBe(true);
    });

    it('should have correct default value for isActive field', () => {
      const schema = Client.rawAttributes;
      
      expect(schema.isActive.defaultValue).toBe(true);
    });
  });
});