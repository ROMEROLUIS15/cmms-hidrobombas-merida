import http from 'k6/http';
import { check, sleep } from 'k6';
import { API, headers } from '../lib/config.js';
import { standardSetup } from '../lib/setup.js';
import { pick } from '../lib/util.js';

/**
 * STRESS — ¿dónde rompe, y cómo rompe?
 *
 * No busca "pasar": busca encontrar el punto de rotura y, sobre todo, VER LA
 * FORMA en que rompe. Sube la carga por escalones hasta muy por encima de lo
 * razonable y observa dónde se dispara la latencia y dónde empiezan los 5xx.
 *
 * Lo importante no es el número mágico de VUs que aguanta, sino QUÉ cede primero.
 * En este sistema el sospechoso habitual es el POOL DE CONEXIONES a Postgres: en
 * Neon (plan gratuito) las conexiones son pocas, y cuando se agotan la API no
 * devuelve 503 sino que se queda esperando, así que el síntoma es una latencia
 * que crece sin techo en vez de un error limpio.
 *
 * Se corre a mano y se LEE el resultado; no está pensado para CI.
 */
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },   // aquí ya se espera degradación
    { duration: '30s', target: 0 },    // ¿se recupera al bajar la carga?
  ],
  thresholds: {
    // Umbrales laxos y NO abortivos: el objetivo es llegar hasta el final y ver
    // la curva completa. Un umbral estricto abortaría justo cuando la prueba
    // empieza a ser interesante.
    http_req_failed: ['rate<0.25'],
  },
};

export function setup() {
  return standardSetup();
}

export default function (data) {
  const auth = { headers: headers(data.token) };

  // Mezcla de lecturas: sin pausas largas, para apretar de verdad.
  const endpoint = pick([
    { url: `${API}/dashboard/stats`, name: 'GET /dashboard/stats' },
    { url: `${API}/clients`, name: 'GET /clients' },
    { url: `${API}/equipment`, name: 'GET /equipment' },
    { url: `${API}/service-reports`, name: 'GET /service-reports' },
    { url: `${API}/equipment/${data.equipmentId}`, name: 'GET /equipment/:id' },
  ]);

  const res = http.get(endpoint.url, Object.assign({ tags: { name: endpoint.name } }, auth));

  check(res, {
    'no 5xx': (r) => r.status < 500,
    'no timeout': (r) => r.status !== 0,
  });

  sleep(0.5);
}
