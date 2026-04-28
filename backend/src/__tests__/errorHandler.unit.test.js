const { errorHandler } = require('../middleware/errorHandler');

describe('Error Handler Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    // Cache original NODE_ENV
    this.originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = this.originalEnv;
    jest.restoreAllMocks();
  });

  it('should handle SequelizeValidationError', () => {
    const error = {
      name: 'SequelizeValidationError',
      errors: [
        { path: 'email', message: 'isEmail validation failed' }
      ]
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'email', message: 'isEmail validation failed' }]
    });
  });

  it('should handle SequelizeUniqueConstraintError', () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [
        { path: 'email', message: 'email must be unique' }
      ]
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Data conflicts with an existing record',
      errors: [{ field: 'email', message: 'email must be unique' }]
    });
  });

  it('should handle generic errors in production (hide stack trace)', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Database connection failed');
    error.statusCode = 503;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error'
    });
    // Ensure stack trace is NOT present
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack');
  });

  it('should handle generic errors in development (show stack trace)', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500); // fallback status
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Something went wrong',
      stack: expect.any(String)
    }));
  });
});
