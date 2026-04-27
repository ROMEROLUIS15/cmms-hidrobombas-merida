const { validateRequest } = require('../middleware/zodMiddleware');
const { z } = require('zod');

describe('Zod Middleware Unit Tests', () => {
  let req;
  let res;
  let next;

  const testSchema = z.object({
    name: z.string().min(3),
    age: z.number().optional()
  });

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next() and update req.body if validation succeeds', () => {
    req.body = { name: 'John', age: 30, extraField: 'ignored' };
    const middleware = validateRequest(testSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ name: 'John', age: 30 }); // extraField should be stripped
  });

  it('should return 400 with formatted errors if validation fails (ZodError)', () => {
    req.body = { name: 'Jo' }; // Too short, fails validation
    const middleware = validateRequest(testSchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Validation failed',
      errors: expect.any(Array)
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(error) if a non-ZodError occurs', () => {
    const errorSchema = {
      parse: () => { throw new Error('Some unexpected error'); }
    };
    const middleware = validateRequest(errorSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});
