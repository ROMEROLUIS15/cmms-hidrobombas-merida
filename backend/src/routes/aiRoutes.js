const express = require('express');
const router = express.Router();
const {
  aiAsk,
  aiChat,
  aiDiagnose,
  aiReindex,
  aiStatus,
  aiStreamChat,
  aiStreamAsk,
  // Agent Maestro
  agentAsk,
  getAvailableTools,
  agentGenerateReport,
  agentDetectAnomaly,
  agentAskQuestion,
  agentRecommendMaintenance,
  agentExecutiveSummary
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// Rutas Existentes (sin cambios)
// ─────────────────────────────────────────────────────────────────────────────
router.use(protect);

router.get('/status', aiStatus);
router.post('/ask', aiAsk);
router.post('/chat', aiChat);
router.post('/diagnose', aiDiagnose);
router.post('/reindex', aiReindex);
router.post('/stream-chat', aiStreamChat);
router.post('/stream-ask', aiStreamAsk);

// ─────────────────────────────────────────────────────────────────────────────
// Rutas del Agent Maestro (nuevas)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/ai/agent/tools - Listar herramientas disponibles (requiere auth,
// hereda router.use(protect) — expone detalles internos del agente).
router.get('/agent/tools', getAvailableTools);

// POST /api/ai/agent/ask - Interface principal
router.post('/agent/ask', agentAsk);

// POST /api/ai/agent/report - Generar reporte
router.post('/agent/report', agentGenerateReport);

// POST /api/ai/agent/anomaly - Detectar anomalías
router.post('/agent/anomaly', agentDetectAnomaly);

// POST /api/ai/agent/question - Hacer pregunta
router.post('/agent/question', agentAskQuestion);

// POST /api/ai/agent/maintenance - Recomendar mantenimiento
router.post('/agent/maintenance', agentRecommendMaintenance);

// POST /api/ai/agent/summary - Resumen ejecutivo
router.post('/agent/summary', agentExecutiveSummary);

module.exports = router;
