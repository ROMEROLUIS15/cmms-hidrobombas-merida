const express = require('express');
const router = express.Router();
const {
  getServiceReports,
  getServiceReportById,
  createServiceReport,
  updateServiceReport,
  deleteServiceReport
} = require('../controllers/serviceReportController');
const { downloadReportPDF, sendReportByEmail } = require('../controllers/pdfController');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/zodMiddleware');
const { createServiceReportSchema, updateServiceReportSchema } = require('../validators/serviceReportValidators');

// All routes require authentication
router.use(protect);

// ── PDF (must be before /:id to avoid param conflict) ────────────────────────
router.get('/:id/pdf', downloadReportPDF);

// ── Email delivery ────────────────────────────────────────────────────────────
router.post('/:id/email', sendReportByEmail);

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/',        getServiceReports);
router.get('/:id',     getServiceReportById);
router.post('/',       validateRequest(createServiceReportSchema), createServiceReport);
router.put('/:id',     validateRequest(updateServiceReportSchema), updateServiceReport);
router.delete('/:id',  deleteServiceReport);

module.exports = router;
