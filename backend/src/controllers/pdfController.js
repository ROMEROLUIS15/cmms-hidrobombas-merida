const asyncHandler = require('express-async-handler');
const { buildReportPDF } = require('../services/pdfService');

/**
 * GET /api/service-reports/:id/pdf
 * Streams a PDF report directly to the client.
 */
const downloadReportPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doc = await buildReportPDF(id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="reporte_${id}.pdf"`
  );

  doc.pipe(res);
});

module.exports = { downloadReportPDF };
