/** @typedef {import('@langchain/core/vectorstores').VectorStore} VectorStore */
/** @typedef {import('@langchain/core/documents').Document} Document */

const {
  getOrCreateVectorStore,
  searchSimilarReports,
  clearVectorStore,
} = require('./vectorStoreProvider');

module.exports = { getOrCreateVectorStore, searchSimilarReports, clearVectorStore };
