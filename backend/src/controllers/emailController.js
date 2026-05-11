const { Resend } = require('resend');
const { buildReportPDF } = require('../services/pdfService');
const { ServiceReport, Client, Equipment } = require('../models');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Email config ──────────────────────────────────────────────────────────────
// DEV  → FROM: onboarding@resend.dev   (Resend testing domain, no verification needed)
//        TO  : RESEND_DEV_OVERRIDE_TO   (must be your Resend-registered email)
// PROD → FROM: RESEND_FROM_EMAIL        (verified domain required in Resend dashboard)
//        TO  : actual client email      (no override)
//
// To migrate to Gmail SMTP later, replace the Resend block in sendReportByEmail
// with nodemailer.createTransport({ service:'gmail', auth:{ user, pass } })
// and set SMTP_USER / SMTP_PASS in your .env — no other changes needed.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const DEV_OVERRIDE_TO = process.env.RESEND_DEV_OVERRIDE_TO || null;

/**
 * Builds the full report PDF as an in-memory Buffer.
 * Reuses the existing pdfService (same PDF the user sees when printing).
 */
const buildPDFBuffer = (reportId) =>
  new Promise((resolve, reject) => {
    buildReportPDF(reportId).then((doc) => {
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    }).catch(reject);
  });

/**
 * POST /api/service-reports/:id/email
 * Body: { recipientEmail: string, recipientName?: string }
 */
const sendReportByEmail = async (req, res) => {
  const { id } = req.params;
  const { recipientEmail, recipientName } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ success: false, message: 'El email del destinatario es requerido.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'El servicio de email no está configurado. Contacte al administrador.',
    });
  }

  // Load report metadata for the email subject/body
  const report = await ServiceReport.findByPk(id, {
    include: [
      { model: Client, as: 'client' },
      { model: Equipment, as: 'equipment' },
    ],
  });

  if (!report) {
    return res.status(404).json({ success: false, message: 'Reporte no encontrado.' });
  }

  // Build PDF using the same service as the print endpoint
  const pdfBuffer = await buildPDFBuffer(id);

  const dateLabel  = report.reportDate
    ? new Date(report.reportDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toISOString().split('T')[0];
  const clientName = report.equipment?.client?.name || report.client?.name || recipientName || 'Cliente';
  const techName   = report.technicianName || '—';
  const systemName = report.systemName || '—';
  const visitType  = report.visitType || '—';
  const reportNum  = report.reportNumber || id;
  const pdfFilename = `reporte-mantenimiento-${reportNum}.pdf`;

  // ── Routing logic ──────────────────────────────────────────────────────────
  // In testing mode (onboarding@resend.dev as FROM), Resend only allows
  // delivery to the account-owner's email. DEV_OVERRIDE_TO captures that.
  // In production, remove RESEND_DEV_OVERRIDE_TO and set a verified FROM domain.
  const actualTo  = DEV_OVERRIDE_TO || recipientEmail;
  const isDevMode = !!DEV_OVERRIDE_TO;

  const subjectPrefix = isDevMode ? '[DEV TEST] ' : '';
  const devBanner = isDevMode
    ? `<p style="background:#fef3c7;border:1px solid #fbbf24;padding:8px 12px;
                border-radius:6px;font-size:12px;color:#92400e;margin-bottom:16px;">
         ⚠️ <strong>Modo de prueba:</strong> Este correo fue redirigido a
         <strong>${actualTo}</strong> en lugar de <strong>${recipientEmail}</strong>.
       </p>`
    : '';

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [actualTo],
    subject: `${subjectPrefix}Reporte ${reportNum} — ${clientName} — ${dateLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
        ${devBanner}
        <div style="background:#1e3a5f;padding:24px;border-radius:10px 10px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Hidrobombas Mérida</h1>
          <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">Sistema de Gestión de Mantenimiento</p>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="color:#1e3a5f;margin-top:0;">Reporte de Mantenimiento</h2>
          <p>Estimado/a <strong>${recipientName || clientName}</strong>,</p>
          <p style="color:#475569;">Adjunto encontrará el reporte de mantenimiento
             correspondiente a la visita del <strong>${dateLabel}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden;">
            <tr style="background:#1e3a5f;">
              <td style="padding:8px 12px;color:#fff;font-size:12px;font-weight:600;">Campo</td>
              <td style="padding:8px 12px;color:#fff;font-size:12px;font-weight:600;">Detalle</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding:8px 12px;color:#64748b;font-size:13px;">N° Reporte</td>
              <td style="padding:8px 12px;font-size:13px;font-weight:600;">${reportNum}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px;color:#64748b;font-size:13px;">Técnico</td>
              <td style="padding:8px 12px;font-size:13px;font-weight:600;">${techName}</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding:8px 12px;color:#64748b;font-size:13px;">Sistema</td>
              <td style="padding:8px 12px;font-size:13px;font-weight:600;">${systemName}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px;color:#64748b;font-size:13px;">Tipo de visita</td>
              <td style="padding:8px 12px;font-size:13px;font-weight:600;">${visitType}</td>
            </tr>
          </table>
          <p style="color:#475569;font-size:14px;">
            Por favor revise el documento adjunto y contáctenos ante cualquier consulta.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="color:#94a3b8;font-size:11px;text-align:center;">
            Correo generado automáticamente por el CMMS de Hidrobombas Mérida.
          </p>
        </div>
      </div>
    `,
    attachments: [{ filename: pdfFilename, content: pdfBuffer }],
  });

  if (error) {
    console.error('Resend error:', error);
    return res.status(502).json({ success: false, message: 'Error al enviar el email. Intente de nuevo.' });
  }

  const message = isDevMode
    ? `Email de prueba enviado a ${actualTo} (redirigido desde ${recipientEmail})`
    : `Reporte enviado exitosamente a ${recipientEmail}`;

  return res.status(200).json({ success: true, message });
};

module.exports = { sendReportByEmail };
