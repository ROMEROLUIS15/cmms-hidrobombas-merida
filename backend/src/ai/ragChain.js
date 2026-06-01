/** @typedef {import('@langchain/core/runnables').Runnable} Runnable */

const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');
const { container } = require('./container');
const { searchSimilarReports } = require('./vectorStore');

const SYSTEM_TEMPLATE = `Eres un asistente experto en mantenimiento industrial que trabaja para Hidrobombas Mérida, una empresa venezolana especializada en mantenimiento de sistemas hidroneumáticos, bombas centrífugas, motores eléctricos y equipos industriales para agua.

Usa ÚNICAMENTE el contexto proporcionado de reportes históricos para responder.
Si la información en el contexto es insuficiente para responder, di honestamente que no tienes datos suficientes.
Siempre responde en español, de manera clara y profesional.

Contexto de reportes históricos:
{context}

Pregunta: {input}

Responde de forma concisa pero completa. Si es relevante, menciona números de reporte y fechas específicas del contexto.`;

/**
 * @param {import('@langchain/core/documents').Document[]} docs
 * @returns {string}
 */
function formatDocs(docs) {
  return docs
    .map(
      (d, i) =>
        `[${i + 1}] Reporte ${d.metadata.reportNumber || 'N/A'} (${d.metadata.reportDate || 'N/A'}) - ${d.metadata.equipmentName || 'Equipo desconocido'}\n${d.pageContent}`
    )
    .join('\n\n');
}

/** @returns {Runnable} */
function createRAGChain() {
  const llm = container.createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_TEMPLATE],
    ['human', '{input}'],
  ]);

  const chain = RunnableSequence.from([
    {
      input: new RunnablePassthrough(),
      context: async (input) => {
        const docs = await searchSimilarReports(input, 5);
        return formatDocs(docs);
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}

let ragChainInstance = null;

/** @returns {Runnable} */
function getRAGChain() {
  if (!ragChainInstance) {
    ragChainInstance = createRAGChain();
  }
  return ragChainInstance;
}

function clearRAGChain() {
  ragChainInstance = null;
}

module.exports = { getRAGChain, clearRAGChain };
