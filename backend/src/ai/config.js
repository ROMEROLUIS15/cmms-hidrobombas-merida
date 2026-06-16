/** @typedef {import('@langchain/core/language_models/chat_models').BaseChatModel} BaseChatModel */
/** @typedef {import('@langchain/core/embeddings').Embeddings} Embeddings */

const { ChatGroq } = require('@langchain/groq');
const { HuggingFaceInferenceEmbeddings } = require('@langchain/community/embeddings/hf');

// Modelo por defecto (elección deliberada documentada en TECH_DEBT.md).
// Configurable vía GROQ_MODEL sin tocar código.
const DEFAULT_GROQ_MODEL = 'llama3-70b-8192';

/** @returns {BaseChatModel} */
function createLLM() {
  return new ChatGroq({
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
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
