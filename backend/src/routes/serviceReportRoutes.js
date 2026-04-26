const express = require('express');
const router = express.Router();
const {
  getServiceReports,
  getServiceReportById,
  createServiceReport,
  updateServiceReport,
  deleteServiceReport
} = require('../controllers/serviceReportController');
const { downloadReportPDF } = require('../controllers/pdfController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ── PDF (must be before /:id to avoid param conflict) ────────────────────────
router.get('/:id/pdf', downloadReportPDF);

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/',        getServiceReports);
router.get('/:id',     getServiceReportById);
router.post('/',       createServiceReport);
router.put('/:id',     updateServiceReport);
router.delete('/:id',  deleteServiceReport);

module.exports = router;
