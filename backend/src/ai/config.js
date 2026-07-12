/** @typedef {import('@langchain/core/language_models/chat_models').BaseChatModel} BaseChatModel */
/** @typedef {import('@langchain/core/embeddings').Embeddings} Embeddings */

const { ChatGroq } = require('@langchain/groq');
const { HuggingFaceInferenceEmbeddings } = require('@langchain/community/embeddings/hf');

// Modelo por defecto (elección deliberada documentada en TECH_DEBT.md).
// Configurable vía GROQ_MODEL sin tocar código.
//
// Groq retiró la familia Llama que usábamos antes (`llama3-70b-8192`), y en
// 2026-06-17 anunció también la baja de `llama-3.3-70b-versatile` y
// `llama-3.1-8b-instant`, que dejan de servirse el 2026-08-16. El reemplazo
// que Groq recomienda para la gama 70B es GPT-OSS 120B; la alternativa más
// barata/rápida es `openai/gpt-oss-20b` (basta con setear GROQ_MODEL).
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

/** Modelo efectivo: el de GROQ_MODEL si está seteado, si no el default. */
const resolveModel = () => process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

/** @returns {BaseChatModel} */
function createLLM() {
  return new ChatGroq({
    model: resolveModel(),
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

module.exports = { createLLM, createEmbeddings, resolveModel, DEFAULT_GROQ_MODEL };
