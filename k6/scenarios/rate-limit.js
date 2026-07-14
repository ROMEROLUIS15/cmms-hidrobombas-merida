import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { API, headers } from '../lib/config.js';
import { login } from '../lib/setup.js';

/**
 * RATE LIMIT — verifica que el limitador SIGUE PROTEGIENDO.
 *
 * Este es el único escenario que se corre con los limitadores ACTIVOS, es decir,
 * SIN RATE_LIMIT_DISABLED. Es la contrapartida del interruptor que permite medir
 * con k6: si alguien lo deja puesto por error, o rompe la lógica de
 * `utils/rateLimitSkip.js`, la API se queda sin defensa contra la fuerza bruta en
 * /login y contra el gasto de tokens del LLM en /ai — y nadie se enteraría,
 * porque todo "funcionaría" mejor que nunca.
 *
 * Aquí un 429 NO es un fallo: es el resultado que se exige. Si no aparece
 * ninguno, la prueba falla.
 *
 *   npm run load:rate-limit     (con el backend arrancado SIN RATE_LIMIT_DISABLED)
 *
 * Consume la ventana de 15 minutos del limitador `api` para tu IP. Es inocuo: el
 * resto de escenarios corre con el limitador desactivado, que ni siquiera cuenta
 * las peticiones.
 */

const LIMIT = 100; // apiLimiter: max 100 / 15 min
const rateLimited = new Counter('rate_limited_429');
const served = new Counter('served_200');

export const options = {
  vus: 1,
  iterations: LIMIT + 20, // pasarse del límite a propósito
  thresholds: {
    // LA aserción de este escenario: el limitador tiene que haber cortado.
    // Sin esto, un backend sin protección alguna pasaría la prueba con un 100%
    // de peticiones "correctas".
    rate_limited_429: ['count>0'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  // No se usa standardSetup(): ese EXIGE que el limitador esté desactivado, y
  // aquí se quiere justo lo contrario.
  return { token: login() };
}

export default function (data) {
  const res = http.get(`${API}/dashboard/stats`, {
    headers: headers(data.token),
    tags: { name: 'GET /dashboard/stats' },
  });

  if (res.status === 429) rateLimited.add(1);
  if (res.status === 200) served.add(1);

  check(res, {
    'responde 200 o 429, nunca 5xx': (r) => r.status === 200 || r.status === 429,
    'expone las cabeceras RateLimit': (r) =>
      Object.keys(r.headers).some((h) => h.toLowerCase() === 'ratelimit-limit'),
  });
}
