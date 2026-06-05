const reporter = require('../utils/errorReporter');

describe('errorReporter', () => {
  afterEach(() => {
    delete process.env.SENTRY_DSN;
    reporter._reset();
  });

  it('queda deshabilitado si no hay SENTRY_DSN', () => {
    reporter.initErrorReporter();
    expect(reporter.isEnabled()).toBe(false);
    expect(reporter.reportError(new Error('x'))).toBe(false);
  });

  it('reportError es un no-op seguro cuando está deshabilitado', () => {
    expect(() => reporter.reportError(new Error('y'), { a: 1 })).not.toThrow();
    expect(reporter.reportError(new Error('y'))).toBe(false);
  });

  it('permanece deshabilitado si hay DSN pero @sentry/node no está instalado', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
    reporter.initErrorReporter();
    expect(reporter.isEnabled()).toBe(false);
  });

  it('initErrorReporter es idempotente', () => {
    reporter.initErrorReporter();
    expect(() => reporter.initErrorReporter()).not.toThrow();
  });
});
