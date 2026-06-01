const asyncHandler = require('express-async-handler');
const { askQuestion, diagnose, chat, reindexReports } = require('../ai');
const { streamChat, streamQuestion } = require('../ai/streaming');

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

  res.status(200).json({
    success: true,
    data: {
      groq_configured: hasGroq,
      huggingface_configured: hasHuggingFace,
      llm_provider: 'Groq (llama3-70b-8192)',
      embeddings_provider: 'HuggingFace (all-MiniLM-L6-v2)',
      vector_store: 'MemoryVectorStore',
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

// ═════════════════════════════════════════════════════════════════════════════
// AGENT MAESTRO - Nuevos endpoints
// ═════════════════════════════════════════════════════════════════════════════

const { getAgent } = require('../services/aiAgent');

/**
 * POST /api/ai/agent/ask
 * Interfaz principal del Agent Maestro
 */
const agentAsk = asyncHandler(async (req, res) => {
  const { request, context = {} } = req.body;

  if (!request || typeof request !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Request must include "request" field with string value'
    });
  }

  try {
    const agent = await getAgent();
    const result = await agent.invoke(request, context);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/agent/tools
 * Lista todas las herramientas disponibles
 */
const getAvailableTools = asyncHandler(async (req, res) => {
  try {
    const agent = await getAgent();
    const tools = agent.getAvailableTools();

    res.status(200).json({
      success: true,
      count: tools.length,
      tools
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/agent/report
 * Generar reporte
 */
const agentGenerateReport = asyncHandler(async (req, res) => {
  const { serviceReportId } = req.body;

  if (!serviceReportId) {
    return res.status(400).json({
      success: false,
      error: 'serviceReportId required'
    });
  }

  try {
    const agent = await getAgent();
    const result = await agent.invoke('Generate a professional maintenance report', {
      serviceReportId
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/agent/anomaly
 * Detectar anomalías
 */
const agentDetectAnomaly = asyncHandler(async (req, res) => {
  const { serviceReportId } = req.body;

  if (!serviceReportId) {
    return res.status(400).json({
      success: false,
      error: 'serviceReportId required'
    });
  }

  try {
    const agent = await getAgent();
    const result = await agent.invoke('Detect any anomalies in this service report', {
      serviceReportId
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/agent/question
 * Hacer pregunta
 */
const agentAskQuestion = asyncHandler(async (req, res) => {
  const { equipmentId, question } = req.body;

  if (!equipmentId || !question) {
    return res.status(400).json({
      success: false,
      error: 'equipmentId and question required'
    });
  }

  try {
    const agent = await getAgent();
    const result = await agent.invoke(question, { equipmentId });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/agent/maintenance
 * Recomendar mantenimiento
 */
const agentRecommendMaintenance = asyncHandler(async (req, res) => {
  const { equipmentId } = req.body;

  if (!equipmentId) {
    return res.status(400).json({
      success: false,
      error: 'equipmentId required'
    });
  }

  try {
    const agent = await getAgent();
    const result = await agent.invoke('When should this equipment have its next maintenance?', {
      equipmentId
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/agent/summary
 * Resumen ejecutivo
 */
const agentExecutiveSummary = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.body;

  try {
    const agent = await getAgent();
    const result = await agent.invoke('Create an executive summary of maintenance activities', {
      period
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
  agentAsk,
  getAvailableTools,
  agentGenerateReport,
  agentDetectAnomaly,
  agentAskQuestion,
  agentRecommendMaintenance,
  agentExecutiveSummary
};
