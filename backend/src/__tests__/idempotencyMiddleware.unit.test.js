const { idempotencyMiddleware } = require('../middleware/idempotencyMiddleware');
const { IdempotencyKey } = require('../models');

jest.mock('../models');

const makeRes = () => {
  const res = {
    statusCode: 200,
    status: jest.fn(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function (body) {
      return body;
    }),
  };
  return res;
};

const makeReq = (overrides = {}) => ({
  headers: { 'x-idempotency-key': 'key-123' },
  method: 'POST',
  originalUrl: '/api/things',
  correlationId: 'corr-1',
  ...overrides,
});

describe('idempotencyMiddleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
    IdempotencyKey.destroy.mockResolvedValue(0);
    IdempotencyKey.findOne.mockResolvedValue(null);
    IdempotencyKey.create.mockResolvedValue({ update: jest.fn(), destroy: jest.fn() });
  });

  it('passes through when no idempotency key is present', async () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(IdempotencyKey.findOne).not.toHaveBeenCalled();
  });

  it('passes through for non-mutating methods (GET)', async () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(IdempotencyKey.findOne).not.toHaveBeenCalled();
  });

  it('returns the cached response for a completed duplicate', async () => {
    IdempotencyKey.findOne.mockResolvedValue({
      responseStatus: 201,
      responseBody: JSON.stringify({ success: true, id: 7 }),
    });
    const req = makeReq();
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, id: 7 });
    expect(IdempotencyKey.create).not.toHaveBeenCalled();
  });

  it('returns 409 when a reservation is still in flight (no body yet)', async () => {
    IdempotencyKey.findOne.mockResolvedValue({ responseStatus: null, responseBody: null });
    const req = makeReq();
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('reserves the key before processing and persists the 2xx response', async () => {
    const reserved = { update: jest.fn().mockResolvedValue(), destroy: jest.fn() };
    IdempotencyKey.create.mockResolvedValue(reserved);
    const req = makeReq();
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(IdempotencyKey.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'key-123', responseStatus: null, responseBody: null })
    );
    expect(next).toHaveBeenCalledTimes(1);

    // Simula que el handler responde 201.
    res.statusCode = 201;
    res.json({ success: true });

    expect(reserved.update).toHaveBeenCalledWith({
      responseStatus: 201,
      responseBody: JSON.stringify({ success: true }),
    });
  });

  it('releases the reservation when the handler responds with an error', async () => {
    const reserved = { update: jest.fn(), destroy: jest.fn().mockResolvedValue() };
    IdempotencyKey.create.mockResolvedValue(reserved);
    const req = makeReq();
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    res.statusCode = 400;
    res.json({ success: false });

    expect(reserved.destroy).toHaveBeenCalled();
    expect(reserved.update).not.toHaveBeenCalled();
  });

  it('handles a lost INSERT race by returning the cached winner', async () => {
    const uniqueErr = new Error('dup');
    uniqueErr.name = 'SequelizeUniqueConstraintError';
    IdempotencyKey.create.mockRejectedValue(uniqueErr);
    IdempotencyKey.findOne
      .mockResolvedValueOnce(null) // primer lookup: nada cacheado todavía
      .mockResolvedValueOnce({
        // winner tras la colisión
        responseStatus: 201,
        responseBody: JSON.stringify({ success: true, id: 9 }),
        path: '/api/things',
        method: 'POST',
      });
    const req = makeReq();
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, id: 9 });
  });

  it('handles a lost INSERT race that is still in flight with 409', async () => {
    const uniqueErr = new Error('dup');
    uniqueErr.name = 'SequelizeUniqueConstraintError';
    IdempotencyKey.create.mockRejectedValue(uniqueErr);
    IdempotencyKey.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ responseBody: null, path: '/api/things', method: 'POST' });
    const req = makeReq();
    const res = makeRes();

    await idempotencyMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
