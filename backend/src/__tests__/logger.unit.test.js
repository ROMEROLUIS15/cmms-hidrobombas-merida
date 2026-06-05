const { logger, LEVELS } = require('../utils/logger');

describe('logger', () => {
  const originalLevel = process.env.LOG_LEVEL;
  let errorSpy, warnSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalLevel === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = originalLevel;
  });

  it('queda en silencio por defecto bajo NODE_ENV=test', () => {
    delete process.env.LOG_LEVEL;
    logger.error('boom');
    logger.warn('careful');
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('emite errores cuando LOG_LEVEL lo permite', () => {
    process.env.LOG_LEVEL = 'error';
    logger.error('boom', { code: 1 });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('respeta el umbral de nivel (info no emite si LOG_LEVEL=error)', () => {
    process.env.LOG_LEVEL = 'error';
    logger.info('hello');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('child() añade bindings a la salida', () => {
    process.env.LOG_LEVEL = 'debug';
    const child = logger.child({ correlationId: 'cid-1' });
    child.error('failed');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('cid-1');
  });

  it('expone la tabla de niveles', () => {
    expect(LEVELS.debug).toBeLessThan(LEVELS.error);
  });
});
