import http from 'k6/http';
import { API, ADMIN_EMAIL, ADMIN_PASSWORD, headers } from './config.js';
import { uuidv4 } from './util.js';

/** Busca una cabecera sin depender de mayúsculas/minúsculas. */
function header(res, name) {
  const target = name.toLowerCase();
  for (const key of Object.keys(res.headers)) {
    if (key.toLowerCase() === target) return res.headers[key];
  }
  return undefined;
}

/**
 * Autentica al admin y devuelve el JWT.
 *
 * OJO: el login es CARO A PROPÓSITO (bcrypt). Se hace UNA vez en `setup()` y el
 * token se comparte con todos los VUs. Loguear en cada iteración mediría el
 * coste de bcrypt —que es alto por diseño— y no el de la API. Para medir el
 * login hay un escenario dedicado (auth) con muy poca carga.
 */
export function login(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const res = http.post(
    `${API}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /auth/login' } }
  );

  if (res.status !== 200) {
    throw new Error(
      `\n\n  ⛔  Login fallido (${res.status}) para ${email}.\n` +
      '      El primer admin NO se crea por la web: ejecútalo con\n' +
      '        cd backend && node bootstrap-admin.js\n' +
      '      y pasa las credenciales con -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=...\n' +
      `      Respuesta: ${res.body}\n`
    );
  }

  return res.json('token');
}

/**
 * Comprueba que los limitadores estén desactivados antes de medir nada.
 *
 * Sin esto, la prueba de carga NO mide la API: mide el 429. El limitador `api`
 * permite 100 req/15min POR IP, y k6 desde una máquina es una sola IP; a partir
 * de la petición 101 todo son rechazos y las latencias salen preciosas porque
 * express corta antes de tocar la base de datos.
 *
 * La detección es directa: con `standardHeaders: true`, express-rate-limit emite
 * `RateLimit-Limit` solo cuando el limitador NO se ha saltado. Si la cabecera
 * está, el limitador está contando.
 */
export function assertRateLimitDisabled(token) {
  const res = http.get(`${API}/dashboard/stats`, {
    headers: headers(token),
    tags: { name: 'GET /dashboard/stats' },
  });

  if (header(res, 'RateLimit-Limit') !== undefined) {
    throw new Error(
      '\n\n  ⛔  Los limitadores de peticiones están ACTIVOS.\n' +
      '      Con ellos puestos no medirías la API, medirías el 429: el limitador\n' +
      '      corta en 100 req/15min por IP y responde sin tocar la base de datos.\n\n' +
      '      Arranca el backend así:\n' +
      '        RATE_LIMIT_DISABLED=true npm run dev:backend\n\n' +
      '      (En producción esa variable se ignora a propósito.\n' +
      '       Ver backend/src/utils/rateLimitSkip.js)\n'
    );
  }
}

/**
 * Crea los datos mínimos para las pruebas de lectura: un cliente y un equipo.
 *
 * Se crean vía API (no por SQL) para que el escenario mida exactamente lo que
 * atraviesa un usuario real: validación Zod, autorización y ORM incluidos.
 */
export function seedFixtures(token) {
  const clientRes = http.post(
    `${API}/clients`,
    JSON.stringify({
      name: `k6 Carga ${uuidv4().slice(0, 8)}`,
      email: `k6-${uuidv4().slice(0, 8)}@carga.test`,
      phone: '0274-1234567',
      address: 'Mérida, Venezuela',
      contactPerson: 'Prueba de Carga',
    }),
    { headers: headers(token), tags: { name: 'POST /clients' } }
  );

  if (clientRes.status !== 201) {
    throw new Error(`No se pudo crear el cliente de prueba (${clientRes.status}): ${clientRes.body}`);
  }
  const clientId = clientRes.json('data.id') || clientRes.json('id');

  const equipmentRes = http.post(
    `${API}/equipment`,
    JSON.stringify({
      name: `Bomba k6 ${uuidv4().slice(0, 8)}`,
      clientId,
      type: 'Hidroneumático',
      brand: 'k6',
      model: 'LOAD-1',
      // El estado sale del enum del MODELO: ['Operativo','En Mantenimiento','Dañado'].
      // Poner 'active' aquí es exactamente el bug que tumbó producción — SQLite lo
      // aceptaba y Postgres lo rechazaba con invalid input value for enum.
      status: 'Operativo',
      location: 'Sala de máquinas',
    }),
    { headers: headers(token), tags: { name: 'POST /equipment' } }
  );

  if (equipmentRes.status !== 201) {
    throw new Error(`No se pudo crear el equipo de prueba (${equipmentRes.status}): ${equipmentRes.body}`);
  }
  const equipmentId = equipmentRes.json('data.id') || equipmentRes.json('id');

  return { clientId, equipmentId };
}

/** setup() estándar: login + verificación de limitadores + fixtures. */
export function standardSetup({ withFixtures = true } = {}) {
  const token = login();
  assertRateLimitDisabled(token);
  const fixtures = withFixtures ? seedFixtures(token) : {};
  return Object.assign({ token }, fixtures);
}
