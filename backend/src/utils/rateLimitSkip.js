/**
 * Decide si los limitadores de peticiones deben saltarse esta petición.
 *
 * Se desactivan en dos casos, y solo en dos:
 *
 *   1. `NODE_ENV=test` — sin esto los tests de integración se bloquean a sí
 *      mismos en cuanto una suite supera los 100 requests.
 *   2. `RATE_LIMIT_DISABLED=true` **fuera de producción** — para poder medir con
 *      k6. El limitador `api` permite 100 req/15min *por IP*, y una prueba de
 *      carga lanzada desde una máquina es una sola IP: sin este interruptor no
 *      se mide la API, se mide el 429.
 *
 * ── Qué cuenta como "producción" ──────────────────────────────────────────────
 *
 * En Vercel **todo** deploy corre con `NODE_ENV=production`, también los de
 * preview y los de staging. Si nos guiáramos solo por `NODE_ENV`, el interruptor
 * sería inútil en cualquier entorno desplegado y no habría forma de medir el
 * sistema real (lambdas + Neon), que es justo lo que interesa: el cuello de
 * botella que no se puede reproducir en local es el pool de conexiones de Neon.
 *
 * Por eso, cuando estamos en Vercel manda `VERCEL_ENV` (`production` | `preview`
 * | `development`), que es la única variable que distingue el deploy de verdad
 * de uno de pruebas. Fuera de Vercel seguimos con `NODE_ENV`.
 *
 * Lo que NO cambia: en **producción real** el interruptor se ignora, esté puesto
 * o no. Allí el límite es una defensa (fuerza bruta contra /login, gasto de
 * tokens del LLM en /ai) y un despiste de configuración —una variable heredada,
 * un `.env` copiado— la desactivaría en silencio y sin dejar rastro.
 *
 * ⚠️ Un deploy de preview/staging con el interruptor puesto tiene los limitadores
 * abiertos y su URL es pública. Es aceptable SOLO si ese entorno no comparte con
 * producción ni la base de datos ni `JWT_SECRET`: un token emitido allí no debe
 * valer aquí, y la fuerza bruta no debe encontrar usuarios reales. El staging se
 * monta con secretos y BD propios precisamente por esto.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {boolean} true si esta petición no debe contar contra el límite
 */
const shouldSkipRateLimit = (env = process.env) => {
  if (env.NODE_ENV === 'test') return true;

  // Exige el string exacto: desarmar una protección debe ser deliberado, no el
  // efecto colateral de un '1' o un 'yes'.
  if (env.RATE_LIMIT_DISABLED !== 'true') return false;

  // Alguien pidió explícitamente desactivarlo. ¿Es producción de verdad?
  // En Vercel manda VERCEL_ENV (NODE_ENV es 'production' hasta en los previews).
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== 'production';

  // Fuera de Vercel, NODE_ENV es la única señal disponible.
  return env.NODE_ENV !== 'production';
};

module.exports = { shouldSkipRateLimit };
