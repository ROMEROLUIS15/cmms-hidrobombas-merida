const { getRAGChain, clearRAGChain } = require('./ragChain');
const { askAssistant } = require('./assistantGraph');
const { runDiagnostic } = require('./diagnosticGraph');
const { getOrCreateVectorStore, clearVectorStore } = require('./vectorStore');

/**
 * @param {string} question
 * @returns {Promise<string>}
 */
async function askQuestion(question) {
  const chain = await getRAGChain();
  const result = await chain.invoke(question);
  return result;
}

/**
 * @param {{ equipmentId?: string, equipmentName?: string, symptoms: string }} params
 * @returns {Promise<{diagnosis: string, recommendations: string, followUpQuestion: string|null}>}
 */
async function diagnose({ equipmentId, equipmentName, symptoms }) {
  return runDiagnostic({ equipmentId, equipmentName, symptoms });
}

/**
 * @param {string} message
 * @returns {Promise<string>}
 */
async function chat(message) {
  return askAssistant(message);
}

/** @returns {Promise<void>} */
async function reindexReports() {
  await clearVectorStore();
  clearRAGChain();
  await getOrCreateVectorStore();
}

module.exports = { askQuestion, diagnose, chat, reindexReports };
