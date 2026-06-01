/** @typedef {import('stream').Readable} Readable */

const { container } = require('./container');

async function* streamChat(message) {
  const llm = container.createLLM();
  const stream = await llm.stream([{ role: 'user', content: message }]);
  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content;
    }
  }
}

async function* streamQuestion(question) {
  const llm = container.createLLM();
  const systemPrompt = {
    role: 'system',
    content: 'Eres un asistente experto en mantenimiento industrial que trabaja para Hidrobombas Mérida. Responde en español de manera clara y profesional.',
  };
  const stream = await llm.stream([systemPrompt, { role: 'user', content: question }]);
  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content;
    }
  }
}

module.exports = { streamChat, streamQuestion };
