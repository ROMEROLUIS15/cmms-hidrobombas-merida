/**
 * Comprobación REAL de la credencial de Groq.
 *
 * Por qué existe: `groq_configured` solo miraba si la variable de entorno
 * estaba presente, no si servía. En producción (2026-07-12) reportaba `true`
 * mientras Groq rechazaba cada llamada con `401 invalid_api_key`: la key estaba
 * revocada. Un "status" que miente sobre el estado del sistema es peor que no
 * tenerlo.
 *
 * Se consulta `GET /openai/v1/models`, que valida la credencial SIN consumir
 * tokens del LLM (a diferencia de un chat de prueba).
 *
 * Distingue tres fallos que se confunden con facilidad:
 *  - `invalid`     → 401: la key existe pero Groq la rechaza (revocada/errónea).
 *  - `unreachable` → 403 geo-bloqueo (Groq bloquea ciertos países, p. ej. desde
 *                    la red local en Venezuela), timeout o error de red. La key
 *                    puede ser perfectamente válida: no podemos saberlo.
 *  - `not_configured` → no hay GROQ_API_KEY.
 */

const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
const DEFAULT_TIMEOUT_MS = 5000;

/** @typedef {'valid'|'invalid'|'unreachable'|'not_configured'} GroqKeyStatus */

/**
 * @param {Object} [opts]
 * @param {string} [opts.apiKey=process.env.GROQ_API_KEY]
 * @param {Function} [opts.fetchImpl=globalThis.fetch] - inyectable para tests.
 * @param {number} [opts.timeoutMs=5000]
 * @returns {Promise<{status: GroqKeyStatus, detail: string|null}>}
 */
const checkGroqKey = async ({
  apiKey = process.env.GROQ_API_KEY,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) => {
  if (!apiKey) {
    return { status: 'not_configured', detail: 'GROQ_API_KEY no está definida.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });

    if (res.ok) {
      return { status: 'valid', detail: null };
    }

    // 401 es el único código que prueba que la credencial es mala. Un 403 aquí
    // es el geo-bloqueo por IP, que NO dice nada sobre la validez de la key.
    if (res.status === 401) {
      return { status: 'invalid', detail: 'Groq rechaza la API key (401). Regenérala en console.groq.com/keys.' };
    }

    return {
      status: 'unreachable',
      detail: `Groq respondió ${res.status}. Si es 403, suele ser el geo-bloqueo por IP: la key puede ser válida.`,
    };
  } catch (error) {
    const reason = error.name === 'AbortError' ? `timeout tras ${timeoutMs}ms` : error.message;
    return { status: 'unreachable', detail: `No se pudo contactar con Groq (${reason}).` };
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { checkGroqKey, GROQ_MODELS_URL };
