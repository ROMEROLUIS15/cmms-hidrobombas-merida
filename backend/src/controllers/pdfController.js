const asyncHandler = require('express-async-handler');
const { buildReportPDF } = require('../services/pdfService');
const { sendServiceReportEmail } = require('../services/emailService');
const { ServiceReport, Equipment, Client, User } = require('../models');

/**
 * GET /api/service-reports/:id/pdf
 * Streams a PDF report directly to the client.
 */
const downloadReportPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doc = await buildReportPDF(id);

  if (!doc) {
    return res.status(404).json({
      success: false,
      message: 'Reporte no encontrado o no se pudo generar el PDF'
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="reporte_${id}.pdf"`
  );

  doc.pipe(res);
});

/**
 * POST /api/service-reports/:id/email
 * Sends the service report via email to the client.
 */
const sendReportByEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clientEmail } = req.body;

  if (!clientEmail) {
    return res.status(400).json({
      success: false,
      message: 'El email del cliente es requerido'
    });
  }

  const report = await ServiceReport.findByPk(id, {
    include: [
      { model: Equipment, as: 'equipment', include: [{ model: Client, as: 'client' }] },
      { model: User, as: 'technician', attributes: ['id', 'username', 'email'] }
    ]
  });

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Reporte no encontrado'
    });
  }

  const clientName = report.equipment?.client?.name || 'Cliente';
  const result = await sendServiceReportEmail(report, clientEmail, clientName);

  if (result.simulated) {
    return res.status(200).json({
      success: true,
      message: 'Email simulado (SMTP no configurado)',
      simulated: true
    });
  }

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: 'Reporte enviado por email exitosamente',
      messageId: result.messageId
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error al enviar el email',
    error: result.error
  });
});

module.exports = { downloadReportPDF, sendReportByEmail };
