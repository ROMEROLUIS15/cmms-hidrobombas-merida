import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { API, headers, THRESHOLDS } from '../lib/config.js';
import { standardSetup } from '../lib/setup.js';

/**
 * LOAD — carga sostenida con la mezcla de tráfico real.
 *
 * El uso real del CMMS es abrumadoramente de LECTURA: el técnico abre el
 * dashboard, busca su cliente, mira el equipo y consulta reportes anteriores.
 * Escribe una vez por visita, al final. Un escenario que reparta 50/50 lecturas
 * y escrituras no mide este sistema, mide otro. Las escrituras tienen su propio
 * escenario (write-flow.js).
 *
 * Carga objetivo: ~20 técnicos concurrentes en campo, que es un orden de
 * magnitud por encima de la plantilla real — el margen es el punto.
 */

const dashboardTrend = new Trend('dashboard_duration', true);
const listTrend = new Trend('list_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // rampa suave
    { duration: '1m', target: 20 },   // subida a la carga objetivo
    { duration: '2m', target: 20 },   // meseta: AQUÍ se mide
    { duration: '30s', target: 0 },   // bajada
  ],
  thresholds: Object.assign({}, THRESHOLDS, {
    // El dashboard hace 4 COUNT() en paralelo sobre toda la tabla: es el
    // candidato número uno a degradarse cuando crezcan los datos.
    dashboard_duration: ['p(95)<600'],
    list_duration: ['p(95)<500'],
  }),
};

export function setup() {
  return standardSetup();
}

export default function (data) {
  const auth = { headers: headers(data.token) };

  // Un técnico abre la app: primero el dashboard.
  group('dashboard', () => {
    const res = http.get(
      `${API}/dashboard/stats`,
      Object.assign({ tags: { name: 'GET /dashboard/stats' } }, auth)
    );
    dashboardTrend.add(res.timings.duration);
    check(res, { 'dashboard 200': (r) => r.status === 200 });
  });

  sleep(1); // el usuario lee la pantalla; sin pausas esto sería un DoS, no una simulación

  // Navega a sus clientes y equipos.
  group('listados', () => {
    const responses = http.batch([
      ['GET', `${API}/clients`, null, Object.assign({ tags: { name: 'GET /clients' } }, auth)],
      ['GET', `${API}/equipment`, null, Object.assign({ tags: { name: 'GET /equipment' } }, auth)],
    ]);

    responses.forEach((res) => listTrend.add(res.timings.duration));
    check(responses[0], { 'clients 200': (r) => r.status === 200 });
    check(responses[1], { 'equipment 200': (r) => r.status === 200 });
  });

  sleep(1);

  // Filtra los equipos de un cliente concreto (?clientId=) y abre el detalle.
  group('detalle', () => {
    const filtered = http.get(
      `${API}/equipment?clientId=${data.clientId}`,
      Object.assign({ tags: { name: 'GET /equipment?clientId' } }, auth)
    );
    check(filtered, { 'equipment filtrado 200': (r) => r.status === 200 });

    const detail = http.get(
      `${API}/equipment/${data.equipmentId}`,
      Object.assign({ tags: { name: 'GET /equipment/:id' } }, auth)
    );
    check(detail, { 'equipment/:id 200': (r) => r.status === 200 });
  });

  sleep(1);

  // Consulta el histórico de reportes.
  group('reportes', () => {
    const res = http.get(
      `${API}/service-reports`,
      Object.assign({ tags: { name: 'GET /service-reports' } }, auth)
    );
    listTrend.add(res.timings.duration);
    check(res, { 'reports 200': (r) => r.status === 200 });
  });

  sleep(2);
}
