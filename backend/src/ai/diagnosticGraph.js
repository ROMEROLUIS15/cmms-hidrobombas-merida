/** @typedef {import('@langchain/langgraph').CompiledStateGraph} CompiledStateGraph */
/**
 * @typedef {Object} DiagnosticState
 * @property {string} equipmentId
 * @property {string} equipmentName
 * @property {string} symptoms
 * @property {string} [equipmentInfo]
 * @property {string} [historicalReports]
 * @property {string} [diagnosis]
 * @property {string} [recommendations]
 * @property {string} [followUpQuestion]
 * @property {Array} [messages]
 */

const { StateGraph, START, END, Annotation } = require('@langchain/langgraph');
const { container } = require('./container');
const { searchSimilarReports } = require('./vectorStore');
const { Op } = require('sequelize');
const { Equipment, Client, ServiceReport } = require('../models');
const {
  DIAGNOSIS_PROMPT,
  RECOMMENDATIONS_PROMPT,
  FOLLOW_UP_PROMPT,
} = require('./prompts');

const DiagnosticState = Annotation.Root({
  equipmentId: Annotation(),
  equipmentName: Annotation(),
  symptoms: Annotation(),
  equipmentInfo: Annotation(),
  historicalReports: Annotation(),
  diagnosis: Annotation(),
  recommendations: Annotation(),
  followUpQuestion: Annotation(),
  messages: Annotation(),
});

/**
 * @param {DiagnosticState} state
 * @returns {Promise<{equipmentInfo: string}>}
 */
async function retrieveEquipment(state) {
  const { equipmentId, equipmentName } = state;
  const query = equipmentId || equipmentName;

  if (!query) {
    return {
      equipmentInfo: 'No se proporcionó ID o nombre del equipo.',
    };
  }

  try {
    const equipment = await Equipment.findOne({
      where: {
        [Op.or]: [
          { id: query },
          { name: { [Op.like]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: ServiceReport,
          as: 'reports',
          limit: 5,
          order: [['createdAt', 'DESC']],
          attributes: [
            'id',
            'reportNumber',
            'reportDate',
            'visitType',
            'observations',
            'recommendations',
          ],
        },
      ],
    });

    return {
      equipmentInfo: equipment
        ? JSON.stringify(equipment, null, 2)
        : 'Equipo no encontrado en la base de datos.',
    };
  } catch (err) {
    return { equipmentInfo: `Error al consultar equipo: ${err.message}` };
  }
}

/**
 * @param {DiagnosticState} state
 * @returns {Promise<{historicalReports: string}>}
 */
async function searchHistory(state) {
  const { symptoms, equipmentName } = state;
  const query = [symptoms, equipmentName].filter(Boolean).join(' ');

  if (!query) {
    return { historicalReports: 'No hay datos para buscar en el historial.' };
  }

  try {
    const results = await searchSimilarReports(query, 3);
    const reports = results.map(
      (r) => `[${r.metadata.reportNumber}] ${r.metadata.reportDate} - ${r.metadata.equipmentName || 'N/A'}\n${r.pageContent}`
    );

    return {
      historicalReports:
        reports.length > 0
          ? reports.join('\n\n---\n\n')
          : 'No se encontraron reportes históricos similares.',
    };
  } catch (err) {
    return {
      historicalReports: `Error al buscar historial: ${err.message}`,
    };
  }
}

/**
 * @param {DiagnosticState} state
 * @returns {Promise<{diagnosis: string}>}
 */
async function generateDiagnosis(state) {
  const llm = container.createLLM();
  const { symptoms, equipmentInfo, historicalReports } = state;

  const prompt = DIAGNOSIS_PROMPT
    .replace('{equipmentInfo}', equipmentInfo || 'No disponible')
    .replace('{historicalReports}', historicalReports || 'No disponible')
    .replace('{symptoms}', symptoms || 'No especificados');

  const response = await llm.invoke([{ role: 'user', content: prompt }]);

  return { diagnosis: response.content };
}

/**
 * @param {DiagnosticState} state
 * @returns {Promise<{recommendations: string}>}
 */
async function recommendActions(state) {
  const llm = container.createLLM();
  const { diagnosis, equipmentInfo } = state;

  const prompt = RECOMMENDATIONS_PROMPT
    .replace('{equipmentInfo}', equipmentInfo || 'No disponible')
    .replace('{diagnosis}', diagnosis || 'No disponible');

  const response = await llm.invoke([{ role: 'user', content: prompt }]);

  return { recommendations: response.content };
}

/**
 * @param {DiagnosticState} state
 * @returns {Promise<{followUpQuestion: string}>}
 */
async function askFollowUp(state) {
  const llm = container.createLLM();
  const { symptoms, equipmentInfo } = state;

  const prompt = FOLLOW_UP_PROMPT
    .replace('{equipmentInfo}', equipmentInfo || 'No disponible')
    .replace('{symptoms}', symptoms || 'No especificados');

  const response = await llm.invoke([{ role: 'user', content: prompt }]);

  return { followUpQuestion: response.content };
}

/**
 * @param {DiagnosticState} state
 * @returns {"askFollowUp"|"generateDiagnosis"}
 */
function needsMoreInfo(state) {
  const hasEquipmentInfo =
    state.equipmentInfo &&
    !state.equipmentInfo.includes('no encontrado') &&
    !state.equipmentInfo.includes('Error');

  const hasSymptoms = state.symptoms && state.symptoms.length > 10;

  if (!hasEquipmentInfo || !hasSymptoms) {
    return 'askFollowUp';
  }

  const historyMentioned = state.historicalReports
    ? state.historicalReports.length > 20
    : false;

  if (!historyMentioned) {
    return 'askFollowUp';
  }

  return 'generateDiagnosis';
}

const workflow = new StateGraph(DiagnosticState)
  .addNode('retrieveEquipment', retrieveEquipment)
  .addNode('searchHistory', searchHistory)
  .addNode('askFollowUp', askFollowUp)
  .addNode('generateDiagnosis', generateDiagnosis)
  .addNode('recommendActions', recommendActions)
  .addEdge(START, 'retrieveEquipment')
  .addEdge('retrieveEquipment', 'searchHistory')
  .addConditionalEdges('searchHistory', needsMoreInfo, {
    askFollowUp: 'askFollowUp',
    generateDiagnosis: 'generateDiagnosis',
  })
  .addEdge('askFollowUp', 'generateDiagnosis')
  .addEdge('generateDiagnosis', 'recommendActions')
  .addEdge('recommendActions', END);

const diagnosticAgent = workflow.compile();

/**
 * @param {{ equipmentId?: string, equipmentName?: string, symptoms?: string }} params
 * @returns {Promise<{diagnosis: string, recommendations: string, followUpQuestion: string|null}>}
 */
async function runDiagnostic({ equipmentId, equipmentName, symptoms }) {
  const result = await diagnosticAgent.invoke({
    equipmentId: equipmentId || '',
    equipmentName: equipmentName || '',
    symptoms: symptoms || '',
  });

  return {
    diagnosis: result.diagnosis || 'No se pudo generar diagnóstico.',
    recommendations: result.recommendations || 'No se pudieron generar recomendaciones.',
    followUpQuestion: result.followUpQuestion || null,
  };
}

module.exports = { diagnosticAgent, runDiagnostic };
