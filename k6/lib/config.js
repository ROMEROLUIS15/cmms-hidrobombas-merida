/**
 * Configuración compartida de las pruebas de carga.
 *
 * Todo se parametriza por variables de entorno de k6 (`-e CLAVE=valor`), nunca
 * por constantes hardcodeadas: el mismo script debe poder apuntar a local, a un
 * preview de Vercel o a un staging sin tocar código.
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8001';
export const API = `${BASE_URL}/api`;

// Credenciales del admin con el que se montan los datos de prueba.
// El primer admin NO se puede crear por la web (ver CLAUDE.md): sale de
// `node backend/bootstrap-admin.js`.
export const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@hidrobombas.test';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin12345';

/**
 * Guardarraíl: NO se dispara carga contra producción por accidente.
 *
 * Esto no es celo excesivo. El backend vive en lambdas de Vercel y la BD es un
 * Neon de plan gratuito: unos cientos de peticiones concurrentes agotan las
 * conexiones y tiran el sistema a los usuarios reales. Y como las pruebas de
 * escritura CREAN clientes, equipos y reportes, además dejarían basura en la
 * base de datos de la empresa, con números de reporte (SRV-XXXX) consumidos
 * para siempre: el contador nunca reutiliza un número.
 *
 * Si alguna vez hay que medir producción de verdad, que sea un acto consciente:
 *   k6 run ... -e BASE_URL=https://... -e I_KNOW_THIS_IS_PROD=true
 */
const REMOTE = /vercel\.app|hidrobombas|neon\.tech/i;

if (REMOTE.test(BASE_URL) && __ENV.I_KNOW_THIS_IS_PROD !== 'true') {
  throw new Error(
    `\n\n  ⛔  BASE_URL apunta a un entorno remoto (${BASE_URL}).\n` +
    '      Una prueba de carga contra producción agota las conexiones de Neon\n' +
    '      (plan gratuito) y crea clientes/equipos/reportes REALES que no se\n' +
    '      pueden borrar limpiamente.\n\n' +
    '      Levanta el backend en local y usa el BASE_URL por defecto.\n' +
    '      Si de verdad quieres medir remoto: -e I_KNOW_THIS_IS_PROD=true\n'
  );
}

/**
 * Umbrales por defecto (SLOs). Un umbral incumplido hace que k6 salga con
 * código != 0, que es lo que convierte esto en una prueba y no en un informe
 * bonito que nadie mira.
 *
 * Los valores son un punto de partida razonable para una API de lectura sobre
 * Postgres; ajústalos con datos reales, no con intuición.
 */
export const THRESHOLDS = {
  // p95 por debajo de 500 ms, p99 por debajo de 1 s.
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  // Menos del 1% de peticiones fallidas.
  http_req_failed: ['rate<0.01'],
  // Ningún check puede fallar más del 1% de las veces.
  checks: ['rate>0.99'],
};

/** Cabeceras base. El JWT viaja en Authorization: Bearer (también acepta cookie). */
export function headers(token, extra) {
  return Object.assign(
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    extra || {}
  );
}
