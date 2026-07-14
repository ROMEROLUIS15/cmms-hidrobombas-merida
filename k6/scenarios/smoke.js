import http from 'k6/http';
import { check, group } from 'k6';
import { API, headers } from '../lib/config.js';
import { standardSetup } from '../lib/setup.js';

/**
 * SMOKE — ¿funciona siquiera?
 *
 * 1 VU, 1 iteración. No mide rendimiento: comprueba que cada endpoint responde
 * lo que debe antes de invertir 10 minutos en un escenario de carga que fallaría
 * por una credencial mal puesta. Es lo primero que se corre y lo que puede vivir
 * en CI.
 */
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    // En un smoke no se negocia: cero fallos.
    checks: ['rate==1.0'],
    http_req_failed: ['rate==0.0'],
  },
};

export function setup() {
  return standardSetup();
}

export default function (data) {
  const auth = { headers: headers(data.token) };

  group('salud pública', () => {
    const res = http.get(`${API}/health`, { tags: { name: 'GET /health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('dashboard', () => {
    const res = http.get(`${API}/dashboard/stats`, {
      headers: headers(data.token),
      tags: { name: 'GET /dashboard/stats' },
    });
    check(res, {
      'stats 200': (r) => r.status === 200,
      'stats trae contadores': (r) => r.json('data.total_clients') !== undefined,
    });
  });

  group('listados', () => {
    const clients = http.get(`${API}/clients`, Object.assign({ tags: { name: 'GET /clients' } }, auth));
    check(clients, { 'clients 200': (r) => r.status === 200 });

    const equipment = http.get(`${API}/equipment`, Object.assign({ tags: { name: 'GET /equipment' } }, auth));
    check(equipment, { 'equipment 200': (r) => r.status === 200 });

    const reports = http.get(`${API}/service-reports`, Object.assign({ tags: { name: 'GET /service-reports' } }, auth));
    check(reports, { 'reports 200': (r) => r.status === 200 });
  });

  group('detalle', () => {
    const res = http.get(`${API}/equipment/${data.equipmentId}`, {
      headers: headers(data.token),
      tags: { name: 'GET /equipment/:id' },
    });
    check(res, { 'equipment/:id 200': (r) => r.status === 200 });
  });

  group('auth', () => {
    const res = http.get(`${API}/auth/profile`, {
      headers: headers(data.token),
      tags: { name: 'GET /auth/profile' },
    });
    check(res, { 'profile 200': (r) => r.status === 200 });
  });

  group('sin token → 401', () => {
    // Un smoke que solo prueba el camino feliz no detecta que la autorización
    // se cayó: si esto devolviera 200, la API estaría abierta.
    //
    // responseCallback NO sobra: por defecto k6 considera "fallida" toda
    // respuesta fuera de 2xx-3xx, así que este 401 —que es justo lo que se
    // exige— envenenaba http_req_failed (8,33%) y hacía fallar el umbral con
    // los 9 checks en verde. Aquí el 401 ES la respuesta esperada.
    const res = http.get(`${API}/clients`, {
      tags: { name: 'GET /clients (sin token)' },
      responseCallback: http.expectedStatuses(401),
    });
    check(res, { 'rechaza sin token': (r) => r.status === 401 });
  });
}
