/** @typedef {import('@langchain/core/language_models/chat_models').BaseChatModel} BaseChatModel */
/** @typedef {import('@langchain/core/embeddings').Embeddings} Embeddings */

const { createLLM: defaultCreateLLM, createEmbeddings: defaultCreateEmbeddings } = require('./config');

const container = {
  /** @type {() => BaseChatModel} */
  createLLM: defaultCreateLLM,
  /** @type {() => Embeddings} */
  createEmbeddings: defaultCreateEmbeddings,
};

/** @param {() => BaseChatModel} fn */
function setCreateLLM(fn) {
  container.createLLM = fn;
}

/** @param {() => Embeddings} fn */
function setCreateEmbeddings(fn) {
  container.createEmbeddings = fn;
}

function resetToDefaults() {
  container.createLLM = defaultCreateLLM;
  container.createEmbeddings = defaultCreateEmbeddings;
}

module.exports = { container, setCreateLLM, setCreateEmbeddings, resetToDefaults };
