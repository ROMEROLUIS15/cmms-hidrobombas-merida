const asyncHandler = require('express-async-handler');
const { askQuestion, diagnose, chat, reindexReports } = require('../ai');
const { streamChat, streamQuestion } = require('../ai/streaming');
const { activeProviderLabel } = require('../ai/vectorStore');
const { resolveModel } = require('../ai/config');
const { checkGroqKey } = require('../ai/health');

const aiAsk = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Se requiere una pregunta en el campo "question".',
    });
  }

  const answer = await askQuestion(question);

  res.status(200).json({ success: true, data: { answer } });
});

const aiChat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Se requiere un mensaje en el campo "message".',
    });
  }

  const response = await chat(message);

  res.status(200).json({ success: true, data: { response } });
});

const aiDiagnose = asyncHandler(async (req, res) => {
  const { equipment_id, equipment_name, symptoms } = req.body;

  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Se requiere la descripción de síntomas en el campo "symptoms".',
    });
  }

  const result = await diagnose({
    equipmentId: equipment_id || null,
    equipmentName: equipment_name || null,
    symptoms,
  });

  res.status(200).json({ success: true, data: result });
});

const aiReindex = asyncHandler(async (req, res) => {
  await reindexReports();

  res.status(200).json({
    success: true,
    message: 'Reportes reindexados correctamente en el vector store.',
  });
});

const aiStatus = asyncHandler(async (req, res) => {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasHuggingFace = !!process.env.HUGGINGFACEHUB_API_KEY;

  // `*_configured` solo dice que la variable EXISTE. Eso mintió en producción:
  // reportaba groq_configured:true mientras Groq rechazaba cada llamada con
  // 401 invalid_api_key. `groq_key_status` valida la credencial de verdad.
  const groqKey = await checkGroqKey();

  res.status(200).json({
    success: true,
    data: {
      groq_configured: hasGroq,
      groq_key_status: groqKey.status,
      groq_key_detail: groqKey.detail,
      huggingface_configured: hasHuggingFace,
      llm_provider: `Groq (${resolveModel()})`,
      embeddings_provider: 'HuggingFace (all-MiniLM-L6-v2)',
      vector_store: activeProviderLabel,
      langgraph_agents: ['assistantGraph', 'diagnosticGraph'],
    },
  });
});

const aiStreamChat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Se requiere un mensaje en el campo "message".',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const token of streamChat(message)) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Error durante la generación de la respuesta.' })}\n\n`);
  } finally {
    res.end();
  }
});

const aiStreamAsk = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Se requiere una pregunta en el campo "question".',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const token of streamQuestion(question)) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Error durante la generación de la respuesta.' })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = {
  aiAsk,
  aiChat,
  aiDiagnose,
  aiReindex,
  aiStatus,
  aiStreamChat,
  aiStreamAsk,
};
