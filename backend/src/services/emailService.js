const nodemailer = require('nodemailer');

const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Email sending is disabled.');
    return null;
  }

  return nodemailer.createTransport(config);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[EmailService] SMTP not configured — simulating password reset for ${email}`);
    return { simulated: true };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: '🔐 Restablecer tu contraseña - CMMS Hidrobombas Mérida',
    html: `
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.warn(`[EmailService] Password reset email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[EmailService] SMTP not configured — simulating welcome email for ${email}`);
    return { simulated: true };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: '👋 Bienvenido al CMMS Hidrobombas Mérida',
    html: `
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};