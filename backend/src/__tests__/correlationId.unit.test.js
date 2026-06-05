const { correlationId, CORRELATION_HEADER } = require('../middleware/correlationId');

describe('correlationId middleware', () => {
  let req, res, next, headers;

  beforeEach(() => {
    headers = {};
    req = {
      get: jest.fn((name) => headers[name.toLowerCase()]),
    };
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  const setHeader = (name, value) => { headers[name.toLowerCase()] = value; };

  it('reutiliza el X-Correlation-Id entrante', () => {
    setHeader('X-Correlation-Id', 'abc-123');

    correlationId(req, res, next);

    expect(req.correlationId).toBe('abc-123');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_HEADER, 'abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('acepta X-Request-Id como alternativa', () => {
    setHeader('X-Request-Id', 'req-9');

    correlationId(req, res, next);

    expect(req.correlationId).toBe('req-9');
  });

  it('genera un id cuando no hay header', () => {
    correlationId(req, res, next);

    expect(typeof req.correlationId).toBe('string');
    expect(req.correlationId.length).toBeGreaterThan(0);
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_HEADER, req.correlationId);
  });

  it('trunca ids excesivamente largos', () => {
    setHeader('X-Correlation-Id', 'x'.repeat(500));

    correlationId(req, res, next);

    expect(req.correlationId.length).toBe(128);
  });
});
