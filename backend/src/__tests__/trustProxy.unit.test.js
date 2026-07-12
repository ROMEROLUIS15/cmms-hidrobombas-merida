const { resolveTrustProxy } = require('../utils/trustProxy');

describe('resolveTrustProxy', () => {
  it('confía en 1 proxy cuando corre en Vercel', () => {
    expect(resolveTrustProxy({ VERCEL: '1' })).toBe(1);
  });

  it('confía en 1 proxy con cualquier valor truthy de VERCEL', () => {
    // Vercel expone VERCEL='1', pero database.js ya trata la var como booleana;
    // mantenemos el mismo criterio para no divergir entre módulos.
    expect(resolveTrustProxy({ VERCEL: 'true' })).toBe(1);
  });

  it('NO confía en ningún proxy fuera de Vercel', () => {
    // Sin proxy delante, confiar en X-Forwarded-For dejaría que un cliente
    // falsee la cabecera y rote IPs para saltarse el rate limit.
    expect(resolveTrustProxy({})).toBe(0);
    expect(resolveTrustProxy({ VERCEL: '' })).toBe(0);
  });

  it('lee de process.env por defecto', () => {
    const original = process.env.VERCEL;

    process.env.VERCEL = '1';
    expect(resolveTrustProxy()).toBe(1);

    process.env.VERCEL = '';
    expect(resolveTrustProxy()).toBe(0);

    if (original === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = original;
  });
});
