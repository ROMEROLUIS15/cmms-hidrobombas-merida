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
const { validateUuidParam } = require('../middleware/validateUuidParam');

// All routes require authentication
router.use(protect);

// Un :id malformado llegaba hasta Postgres y devolvía 500
// (`invalid input syntax for type uuid`). Ahora corta aquí con un 404.
const uuid = validateUuidParam('id');

// ── PDF (must be before /:id to avoid param conflict) ────────────────────────
router.get('/:id/pdf', uuid, downloadReportPDF);

// ── Email delivery ────────────────────────────────────────────────────────────
router.post('/:id/email', uuid, sendReportByEmail);

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/',        getServiceReports);
router.get('/:id',     uuid, getServiceReportById);
router.post('/',       validateRequest(createServiceReportSchema), createServiceReport);
router.put('/:id',     uuid, validateRequest(updateServiceReportSchema), updateServiceReport);
router.delete('/:id',  uuid, deleteServiceReport);

module.exports = router;
