/**
 * Decide si los limitadores de peticiones deben saltarse esta petición.
 *
 * Se desactivan en dos casos, y solo en dos:
 *
 *   1. `NODE_ENV=test` — sin esto los tests de integración se bloquean a sí
 *      mismos en cuanto una suite supera los 100 requests.
 *   2. `RATE_LIMIT_DISABLED=true` — para poder medir con k6. El limitador `api`
 *      permite 100 req/15min *por IP*, y una prueba de carga lanzada desde una
 *      máquina es una sola IP: sin este interruptor no se mide la API, se mide
 *      el 429.
 *
 * El segundo caso NUNCA aplica en producción, aunque la variable esté puesta.
 * Allí el límite es una defensa real (fuerza bruta contra /login, gasto de
 * tokens del LLM en /ai) y un despiste de configuración —una variable heredada
 * de un entorno de pruebas, un `.env` copiado— la desactivaría en silencio y
 * sin dejar rastro. El coste de esta línea es cero; el de no tenerla, una
 * puerta abierta que nadie vería hasta que la usen.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {boolean} true si esta petición no debe contar contra el límite
 */
const shouldSkipRateLimit = (env = process.env) => {
  if (env.NODE_ENV === 'test') return true;
  if (env.NODE_ENV === 'production') return false;
  return env.RATE_LIMIT_DISABLED === 'true';
};

module.exports = { shouldSkipRateLimit };
