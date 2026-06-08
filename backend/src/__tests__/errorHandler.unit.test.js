const { errorHandler } = require('../middleware/errorHandler');

describe('Error Handler Middleware Unit Tests', () => {
  let req, res, next;
  // FIX: Arrow functions do not bind `this` to Jest's describe context.
  // A module-scoped `let` variable is the correct pattern for backup/restore.
  let originalNodeEnv;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    // Arrange: capture current NODE_ENV before each test
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Teardown: reliably restore NODE_ENV after each test
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('should handle SequelizeValidationError with a 400 status and formatted field errors', () => {
    // Arrange
    const error = {
      name: 'SequelizeValidationError',
      errors: [
        { path: 'email', message: 'isEmail validation failed' }
      ]
    };

    // Act
    errorHandler(error, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'email', message: 'isEmail validation failed' }]
    });
  });

  it('should handle SequelizeUniqueConstraintError with a 400 status and conflict message', () => {
    // Arrange
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [
        { path: 'email', message: 'email must be unique' }
      ]
    };

    // Act
    errorHandler(error, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Data conflicts with an existing record',
      errors: [{ field: 'email', message: 'email must be unique' }]
    });
  });

  it('should hide the stack trace and use the error statusCode in production mode', () => {
    // Arrange
    process.env.NODE_ENV = 'production';
    const error = new Error('Database connection failed');
    error.statusCode = 503;

    // Act
    errorHandler(error, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error'
    });
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack');
  });

  it('should expose the stack trace and the original message in development mode', () => {
    // Arrange
    process.env.NODE_ENV = 'development';
    const error = new Error('Something went wrong');

    // Act
    errorHandler(error, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500); // fallback to 500 when no statusCode
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Something went wrong',
      stack: expect.any(String)
    }));
  });
});
