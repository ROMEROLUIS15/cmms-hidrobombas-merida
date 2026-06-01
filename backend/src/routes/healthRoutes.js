const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

/**
 * Public health check routes
 * No authentication required - these are meant for monitoring services
 */

// GET /health - Simple health check
router.get('/', healthCheck);

// GET /health/status - Alias
router.get('/status', healthCheck);

module.exports = router;
