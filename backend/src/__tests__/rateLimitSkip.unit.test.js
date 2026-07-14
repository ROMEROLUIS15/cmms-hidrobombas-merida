const { shouldSkipRateLimit } = require('../utils/rateLimitSkip');

describe('shouldSkipRateLimit', () => {
  it('salta el límite en tests', () => {
    // Sin esto una suite de integración se bloquea a sí misma al pasar de 100 requests.
    expect(shouldSkipRateLimit({ NODE_ENV: 'test' })).toBe(true);
  });

  it('salta el límite con RATE_LIMIT_DISABLED=true fuera de producción', () => {
    // El caso de k6: 100 req/15min por IP convertirían la prueba de carga en una
    // medición del 429.
    expect(
      shouldSkipRateLimit({ NODE_ENV: 'development', RATE_LIMIT_DISABLED: 'true' })
    ).toBe(true);
  });

  it('IGNORA RATE_LIMIT_DISABLED en producción', () => {
    // La razón de ser de este módulo. En producción el límite es la defensa
    // contra fuerza bruta en /login y contra el gasto de tokens en /ai: una
    // variable heredada de un entorno de pruebas no puede desarmarla en silencio.
    expect(
      shouldSkipRateLimit({ NODE_ENV: 'production', RATE_LIMIT_DISABLED: 'true' })
    ).toBe(false);
  });

  it('NO salta el límite por defecto', () => {
    expect(shouldSkipRateLimit({})).toBe(false);
    expect(shouldSkipRateLimit({ NODE_ENV: 'development' })).toBe(false);
  });

  it('exige el string "true" exacto, no cualquier valor truthy', () => {
    // '1', 'yes' o 'false' no desactivan nada: desarmar una protección debe ser
    // un acto deliberado, no el efecto colateral de un valor mal escrito.
    expect(shouldSkipRateLimit({ NODE_ENV: 'development', RATE_LIMIT_DISABLED: '1' })).toBe(false);
    expect(shouldSkipRateLimit({ NODE_ENV: 'development', RATE_LIMIT_DISABLED: 'false' })).toBe(false);
  });
});
