const { Resend } = require('resend');
const { logger } = require('../utils/logger');

/**
 * Servicio de email con soporte de varios proveedores (gratis, sin dominio propio):
 *   1. Brevo  — si BREVO_API_KEY está definida (API HTTP, remitente verificado).
 *   2. Resend — si RESEND_API_KEY está definida (requiere dominio para terceros).
 *   3. Simulado — si no hay ninguna key (tests/CI no envían correos reales).
 * Las tres rutas devuelven el mismo contrato:
 *   { simulated:true } | { success:true, messageId? } | { success:false, error }
 */

/**
 * En desarrollo, *_DEV_OVERRIDE_TO redirige TODOS los correos a una dirección de
 * prueba para no enviar a clientes reales mientras se prueba.
 * @param {string} to
 * @returns {string}
 */
const resolveTo = (to) =>
  process.env.EMAIL_DEV_OVERRIDE_TO || process.env.RESEND_DEV_OVERRIDE_TO || to;

/** Envío vía Brevo (Transactional Email API). */
const sendViaBrevo = async ({ to, subject, html }) => {
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || 'CMMS Hidrobombas Mérida',
  };

  const resp = await globalThis.fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return { success: false, error: data.message || `Brevo HTTP ${resp.status}` };
  }
  return { success: true, messageId: data.messageId };
};

/** Envío vía Resend. */
const sendViaResend = async ({ to, subject, html }) => {
  const from = process.env.RESEND_FROM_EMAIL || 'CMMS Hidrobombas <onboarding@resend.dev>';
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    return { success: false, error: error.message || JSON.stringify(error) };
  }
  return { success: true, messageId: data?.id };
};

/**
 * Envía un correo con el proveedor configurado y normaliza el resultado.
 * @param {{ to: string, subject: string, html: string, kind: string }} params
 */
const send = async ({ to, subject, html, kind }) => {
  const hasBrevo = !!process.env.BREVO_API_KEY;
  const hasResend = !!process.env.RESEND_API_KEY;

  if (!hasBrevo && !hasResend) {
    logger.warn(`Sin proveedor de email configurado; simulando ${kind}`, { to });
    return { simulated: true };
  }

  const recipient = resolveTo(to);
  if (recipient !== to) {
    logger.info('Email redirigido por DEV_OVERRIDE_TO', { original: to, recipient });
  }

  const provider = hasBrevo ? 'brevo' : 'resend';
  try {
    const result = hasBrevo
      ? await sendViaBrevo({ to: recipient, subject, html })
      : await sendViaResend({ to: recipient, subject, html });

    if (result.success) {
      logger.info(`${kind} enviado`, { provider, messageId: result.messageId, to: recipient });
    } else {
      logger.error(`Error enviando ${kind}`, { provider, message: result.error });
    }
    return result;
  } catch (err) {
    logger.error(`Error enviando ${kind}`, { provider, message: err.message });
    return { success: false, error: err.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 10px;">
        <h1 style="color: #ffffff; margin: 0;">Hidrobombas Mérida</h1>
        <p style="color: #e0e0e0; margin-top: 10px;">Sistema de Gestión de Mantenimiento</p>
      </div>

      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">¿Olvidaste tu contraseña?</h2>
        <p style="color: #666; line-height: 1.6;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en el sistema CMMS.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #2d5a87; color: #ffffff; padding: 15px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;
                    font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>

        <p style="color: #999; font-size: 12px;">
          Este enlace expirará en <strong>1 hora</strong>.<br>
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 11px;">
          Correo enviado automáticamente por el sistema CMMS de Hidrobombas Mérida.
        </p>
      </div>
    </div>
  `;

  return send({
    to: email,
    subject: '🔐 Restablecer tu contraseña - CMMS Hidrobombas Mérida',
    html,
    kind: 'password reset email',
  });
};

const sendWelcomeEmail = async (email, name) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 10px;">
        <h1 style="color: #ffffff; margin: 0;">Hidrobombas Mérida</h1>
        <p style="color: #e0e0e0; margin-top: 10px;">Sistema de Gestión de Mantenimiento</p>
      </div>

      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">¡Bienvenido, ${name}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Tu cuenta ha sido creada exitosamente en el sistema CMMS de Hidrobombas Mérida.
        </p>

        <p style="color: #666;">
          Ya puedes iniciar sesión en: <strong>${frontendUrl}</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 11px;">
          Correo enviado automáticamente por el sistema CMMS de Hidrobombas Mérida.
        </p>
      </div>
    </div>
  `;

  return send({
    to: email,
    subject: '👋 Bienvenido al CMMS Hidrobombas Mérida',
    html,
    kind: 'welcome email',
  });
};

const sendServiceReportEmail = async (report, clientEmail, _clientName) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const reportUrl = `${frontendUrl}/service-reports/${report.id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 10px;">
        <h1 style="color: #ffffff; margin: 0;">Hidrobombas Mérida</h1>
        <p style="color: #e0e0e0; margin-top: 10px;">Sistema de Gestión de Mantenimiento</p>
      </div>

      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Reporte de Servicio: ${report.reportNumber}</h2>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(report.reportDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Tipo de Visita:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${report.visitType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Equipo:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${report.equipment?.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Técnico:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${report.technician?.username || 'N/A'}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}"
             style="background: #2d5a87; color: #ffffff; padding: 15px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;
                    font-weight: bold;">
            Ver Reporte Completo
          </a>
        </div>

        <p style="color: #999; font-size: 11px;">
          Este es un correo automático. Si tienes alguna pregunta, contacta a Hidrobombas Mérida.
        </p>
      </div>
    </div>
  `;

  return send({
    to: clientEmail,
    subject: `📋 Reporte de Servicio ${report.reportNumber} - Hidrobombas Mérida`,
    html,
    kind: 'service report email',
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendServiceReportEmail,
};
