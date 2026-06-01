/** @type {string} */
const DIAGNOSIS_PROMPT = `Eres un ingeniero de mantenimiento experto en sistemas hidroneumáticos y equipos industriales.

INFORMACIÓN DEL EQUIPO:
{equipmentInfo}

HISTORIAL DE REPORTES SIMILARES:
{historicalReports}

SÍNTOMAS REPORTADOS POR EL TÉCNICO:
{symptoms}

Basado en la información anterior, realiza un diagnóstico profesional:
1. Análisis de los síntomas
2. Posibles causas raíz
3. Componentes que deberían revisarse
4. Prioridad de la intervención (Alta/Media/Baja)

Responde en español, sé específico y profesional.`;

const RECOMMENDATIONS_PROMPT = `Basado en el siguiente diagnóstico de un equipo industrial, genera recomendaciones de acción:

EQUIPO:
{equipmentInfo}

DIAGNÓSTICO:
{diagnosis}

Genera:
1. Acciones correctivas inmediatas
2. Próximos pasos
3. Refacciones/partes que podrían necesitarse
4. Recomendaciones para prevenir recurrencia

Responde en español, con un enfoque práctico para un técnico de campo.`;

const FOLLOW_UP_PROMPT = `Eres un ingeniero de diagnóstico. El técnico reportó estos síntomas en un equipo industrial:

EQUIPO:
{equipmentInfo}

SÍNTOMAS:
{symptoms}

La información disponible es insuficiente para un diagnóstico completo.
Genera una SOLA pregunta específica que ayude a precisar el problema.
Pregunta algo como mediciones, observaciones o tests simples que el técnico pueda hacer en campo.

Responde SOLO con la pregunta, nada más.`;

module.exports = {
  DIAGNOSIS_PROMPT,
  RECOMMENDATIONS_PROMPT,
  FOLLOW_UP_PROMPT,
};
