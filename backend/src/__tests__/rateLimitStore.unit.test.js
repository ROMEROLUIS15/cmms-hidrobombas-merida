const { createRateLimitStore, withMemoryFallback, _resetClientForTests } = require('../config/rateLimitStore');

describe('rateLimitStore', () => {
  const originalUrl = process.env.REDIS_URL;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
    _resetClientForTests();
    jest.restoreAllMocks();
  });

  describe('createRateLimitStore', () => {
    it('sin REDIS_URL devuelve undefined (express-rate-limit usa su MemoryStore)', () => {
      delete process.env.REDIS_URL;
      _resetClientForTests();

      expect(createRateLimitStore('rl:test:')).toBeUndefined();
    });
  });

  describe('withMemoryFallback — un Redis caído NO debe tumbar la API', () => {
    /**
     * El bug que rompió producción: express-rate-limit propaga cualquier error del
     * store al middleware de errores, así que un Redis inaccesible convertía CADA
     * `POST /api/auth/login` en un 500. El rate limiting es una protección, no una
     * dependencia crítica: si Redis falla debe degradar, no dejar a nadie fuera.
     */
    const brokenRedis = () => ({
      init: jest.fn(),
      increment: jest.fn().mockRejectedValue(new Error("Stream isn't writeable")),
      decrement: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      resetKey: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    });

    const fakeMemory = () => ({
      init: jest.fn(),
      increment: jest.fn().mockResolvedValue({ totalHits: 1, resetTime: undefined }),
      decrement: jest.fn().mockResolvedValue(undefined),
      resetKey: jest.fn().mockResolvedValue(undefined),
    });

    it('increment: si Redis revienta, cae a memoria y NO propaga el error', async () => {
      const redis = brokenRedis();
      const memory = fakeMemory();
      const store = withMemoryFallback(redis, memory);

      const res = await store.increment('ip-1');

      expect(res).toEqual({ totalHits: 1, resetTime: undefined });
      expect(redis.increment).toHaveBeenCalledWith('ip-1');
      expect(memory.increment).toHaveBeenCalledWith('ip-1');
    });

    it('decrement y resetKey también degradan sin lanzar', async () => {
      const store = withMemoryFallback(brokenRedis(), fakeMemory());

      await expect(store.decrement('ip-1')).resolves.toBeUndefined();
      await expect(store.resetKey('ip-1')).resolves.toBeUndefined();
    });

    it('con Redis sano NO toca el fallback', async () => {
      const redis = {
        init: jest.fn(),
        increment: jest.fn().mockResolvedValue({ totalHits: 7, resetTime: undefined }),
        decrement: jest.fn(),
        resetKey: jest.fn(),
      };
      const memory = fakeMemory();
      const store = withMemoryFallback(redis, memory);

      const res = await store.increment('ip-1');

      expect(res.totalHits).toBe(7);
      expect(memory.increment).not.toHaveBeenCalled();
    });

    it('init propaga las opciones a ambos stores', () => {
      const redis = brokenRedis();
      const memory = fakeMemory();
      const store = withMemoryFallback(redis, memory);

      const options = { windowMs: 900000 };
      store.init(options);

      expect(redis.init).toHaveBeenCalledWith(options);
      expect(memory.init).toHaveBeenCalledWith(options);
    });
  });
});
