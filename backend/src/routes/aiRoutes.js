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
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/status', aiStatus);
router.post('/ask', aiAsk);
router.post('/chat', aiChat);
router.post('/diagnose', aiDiagnose);
router.post('/reindex', aiReindex);
router.post('/stream-chat', aiStreamChat);
router.post('/stream-ask', aiStreamAsk);

module.exports = router;
