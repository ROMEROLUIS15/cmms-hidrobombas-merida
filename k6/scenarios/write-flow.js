import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { API, headers } from '../lib/config.js';
import { standardSetup } from '../lib/setup.js';
import { uuidv4 } from '../lib/util.js';

/**
 * WRITE FLOW — el camino de escritura, que es donde está el cuello de botella.
 *
 * Mide lo que hace un técnico al cerrar una visita: crear el reporte y
 * descargar el PDF. Dos puntos calientes conocidos, y por eso se miden aparte:
 *
 *  1. NÚMERO DE REPORTE (utils/reportNumber.js). Cada alta abre una transacción
 *     y bloquea con SELECT ... FOR UPDATE la MISMA fila del contador. Es un
 *     punto de serialización global: por muchos VUs que se lancen, las altas se
 *     ponen en fila india. Es correcto (nunca reutiliza un número) pero acota el
 *     throughput máximo de escritura, y esa cota es justo lo que interesa medir.
 *
 *  2. PDF (pdfkit). Genera el documento en memoria, en el mismo proceso. Es CPU
 *     puro y en una lambda compite con el resto de peticiones.
 *
 * Cada alta manda su propia X-Idempotency-Key, igual que el frontend real. Si se
 * reutilizara la clave, el middleware devolvería la respuesta cacheada y estaríamos
 * midiendo la caché, no la escritura.
 */

const reportCreateTrend = new Trend('report_create_duration', true);
const pdfTrend = new Trend('pdf_duration', true);
const writeErrors = new Rate('write_errors');
const reportsCreated = new Counter('reports_created');

export const options = {
  scenarios: {
    // Tasa fija (no VUs fijos): así se mide si el sistema AGUANTA un ritmo dado,
    // que es la pregunta de negocio. Con VUs fijos, un backend lento simplemente
    // haría menos peticiones y las latencias saldrían engañosamente bien.
    escrituras: {
      executor: 'constant-arrival-rate',
      // Ritmo objetivo. Se parametriza (-e RATE=40) porque el número interesante
      // no es este, sino el TECHO: sube el ritmo hasta que dropped_iterations
      // deje de ser 0 y habrás encontrado el límite del bloqueo del contador.
      rate: Number(__ENV.RATE || 5),
      timeUnit: '1s',
      duration: __ENV.DURATION || '1m',
      preAllocatedVUs: 10,
      maxVUs: 100,              // si necesita muchos VUs para sostener el ritmo, se está degradando
    },
  },
  thresholds: {
    // El alta incluye la transacción con bloqueo de fila: se le da más margen
    // que a una lectura, pero no barra libre.
    report_create_duration: ['p(95)<1500'],
    // El PDF es CPU pura; si esto se dispara, hay que sacarlo del request.
    pdf_duration: ['p(95)<3000'],
    write_errors: ['rate<0.01'],
    // Si k6 no consigue sostener las 5 altas/s, el ejecutor lo avisa aquí.
    dropped_iterations: ['count<10'],
  },
};

export function setup() {
  return standardSetup();
}

export default function (data) {
  const auth = headers(data.token);
  let reportId;

  group('crear reporte', () => {
    // Clave única por iteración: es lo que hace el frontend (clientRequestId) y
    // lo que permite reintentar sin duplicar. Reutilizarla mediría la caché.
    const idempotencyKey = uuidv4();

    const payload = JSON.stringify({
      equipment_id: data.equipmentId,
      // visit_type sale del enum del MODELO: ['mensual','eventual','technical'].
      // 'semestral' NO existe — un test lo daba por bueno y Postgres lo rechazaba.
      visit_type: 'mensual',
      system_name: 'Sistema hidroneumático k6',
      report_date: new Date().toISOString(),
      technician_name: 'Prueba de Carga',
      observations: 'Reporte generado por la prueba de carga k6.',
      recommendations: 'Ninguna.',
      water_energy_data: { voltaje: 220, amperaje: 12.5, presion: 40 },
      motor_1_data: { temperatura: 65, rpm: 3450, estado: 'Operativo' },
      _clientRequestId: idempotencyKey,
    });

    const res = http.post(`${API}/service-reports`, payload, {
      headers: headers(data.token, { 'X-Idempotency-Key': idempotencyKey }),
      tags: { name: 'POST /service-reports' },
    });

    reportCreateTrend.add(res.timings.duration);
    const ok = check(res, {
      'reporte creado (201)': (r) => r.status === 201,
      'devuelve reportNumber': (r) => !!(r.json('data.reportNumber') || r.json('data.report_number')),
    });

    writeErrors.add(!ok);
    if (ok) {
      reportsCreated.add(1);
      reportId = res.json('data.id') || res.json('id');
    }
  });

  // Descargar el PDF del reporte recién creado: CPU en el mismo proceso.
  if (reportId) {
    group('descargar PDF', () => {
      const res = http.get(`${API}/service-reports/${reportId}/pdf`, {
        headers: { Authorization: auth.Authorization },
        tags: { name: 'GET /service-reports/:id/pdf' },
      });

      pdfTrend.add(res.timings.duration);
      const ok = check(res, {
        'PDF 200': (r) => r.status === 200,
        'es un PDF de verdad': (r) => String(r.body).startsWith('%PDF'),
      });
      writeErrors.add(!ok);
    });
  }
}

export function teardown(data) {
  // Los reportes creados NO se borran: el contador nunca reutiliza un número, así
  // que borrarlos no devolvería el sistema a su estado previo y daría una falsa
  // sensación de limpieza. Corre esto contra una BD desechable (ver k6/README.md).
  console.log(
    `\n  Datos de prueba dejados en la BD (cliente ${data.clientId}, equipo ${data.equipmentId}).\n` +
    '  Es intencionado: usa una base de datos desechable, no una que te importe.\n'
  );
}
