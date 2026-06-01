/** @typedef {import('@langchain/core/language_models/chat_models').BaseChatModel} BaseChatModel */
/** @typedef {import('@langchain/core/embeddings').Embeddings} Embeddings */

const { ChatGroq } = require('@langchain/groq');
const { HuggingFaceInferenceEmbeddings } = require('@langchain/community/embeddings/hf');

/** @returns {BaseChatModel} */
function createLLM() {
  return new ChatGroq({
    model: 'llama3-70b-8192',
    temperature: 0.1,
    apiKey: process.env.GROQ_API_KEY,
  });
}

/** @returns {Embeddings} */
function createEmbeddings() {
  return new HuggingFaceInferenceEmbeddings({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  });
}

module.exports = { createLLM, createEmbeddings };
