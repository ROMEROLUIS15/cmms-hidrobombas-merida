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
 * Guardarraíl en dos niveles: PRODUCCIÓN nunca; el resto de entornos remotos,
 * solo a conciencia.
 *
 * Esto no es celo excesivo. Una prueba de carga contra producción agota las
 * conexiones del Neon gratuito y tira el sistema a los usuarios reales. Y como
 * las pruebas de escritura CREAN clientes, equipos y reportes, dejaría basura en
 * la base de datos de la empresa con números de reporte (SRV-XXXX) consumidos
 * para siempre: el contador nunca reutiliza un número, así que ni borrando las
 * filas se vuelve al estado anterior.
 *
 * Los dominios de producción se bloquean **sin escapatoria**: no hay flag que
 * los habilite. Una prueba de carga contra producción nunca es lo que quieres, y
 * un `-e` de más a las 2 de la mañana no puede ser lo único que lo impida.
 *
 * El staging (que sí hay que poder medir: el pool de conexiones de Neon solo
 * existe desplegado) es remoto pero no producción, así que exige un opt-in:
 *   k6 run ... -e BASE_URL=https://<staging>.vercel.app -e ALLOW_REMOTE=true
 */
const PROD_HOSTS = [
  'cmms-hidrobombas-merida-backend.vercel.app',
  'hidrobombas-merida.vercel.app',
];

const isProdHost = PROD_HOSTS.some((host) => BASE_URL.includes(host));
const isRemote = /^https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(BASE_URL);

if (isProdHost) {
  throw new Error(
    `\n\n  ⛔  BASE_URL apunta a PRODUCCIÓN (${BASE_URL}).\n` +
    '      Esto no tiene override, y es a propósito: la carga agotaría las\n' +
    '      conexiones de Neon dejando sin servicio a los usuarios reales, y\n' +
    '      crearía clientes, equipos y reportes que NO se pueden borrar\n' +
    '      limpiamente (el contador nunca reutiliza un SRV-XXXX).\n\n' +
    '      Mide contra staging o contra local.\n'
  );
}

if (isRemote && __ENV.ALLOW_REMOTE !== 'true') {
  throw new Error(
    `\n\n  ⛔  BASE_URL apunta a un entorno remoto (${BASE_URL}).\n` +
    '      Comprueba que NO comparte base de datos con producción y repite con:\n' +
    '        -e ALLOW_REMOTE=true\n'
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

/**
 * Cabecera de bypass de la protección de despliegue de Vercel.
 *
 * El staging NO es público: Vercel Authentication lo protege y responde 302 al SSO.
 * Dejarlo abierto sería peor idea de lo que parece — es un entorno con los
 * limitadores DESACTIVADOS, o sea, sin defensa contra fuerza bruta. Así que se
 * queda protegido y solo k6 pasa, con un secreto de automatización:
 *
 *   k6 run ... -e VERCEL_BYPASS=$(grep VERCEL_BYPASS backend/.staging.env | cut -d= -f2)
 */
const BYPASS = __ENV.VERCEL_BYPASS
  ? { 'x-vercel-protection-bypass': __ENV.VERCEL_BYPASS }
  : {};

/**
 * Cabeceras de una petición. El JWT viaja en Authorization: Bearer (el backend
 * también acepta cookie). Con token=null se omite Authorization — así los casos
 * anónimos (login, el 401 esperado del smoke) siguen llevando el bypass, que si
 * no se les olvidaría y recibirían un 302 del SSO en vez de la respuesta real.
 */
export function headers(token, extra) {
  const base = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return Object.assign(base, BYPASS, extra || {});
}
