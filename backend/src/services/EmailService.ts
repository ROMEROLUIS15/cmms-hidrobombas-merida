import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { EmailOptions } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.user && config.email.pass ? {
        user: config.email.user,
        pass: config.email.pass,
      } : undefined,
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In development mode, just log the email
      if (config.app.nodeEnv === 'development') {
        console.log('📧 Email would be sent in production:');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML: ${options.html.substring(0, 200)}...`);
        return true;
      }

      await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verificación de Email - CMMS Hidrobombas</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">¡Bienvenido a CMMS Hidrobombas!</h2>
          
          <p>Hola <strong>${username}</strong>,</p>
          
          <p>Gracias por registrarte en nuestro sistema CMMS. Para completar tu registro, necesitas verificar tu dirección de email.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verificar Email
            </a>
          </div>
          
          <p>Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          
          <p><strong>Este enlace expirará en ${config.security.verifyTokenExpiryHours} horas.</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Si no te registraste en CMMS Hidrobombas, puedes ignorar este email.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verificación de Email - CMMS Hidrobombas',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperación de Contraseña - CMMS Hidrobombas</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Recuperación de Contraseña</h2>
          
          <p>Hola <strong>${username}</strong>,</p>
          
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en CMMS Hidrobombas.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p>Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
          
          <p><strong>Este enlace expirará en ${config.security.resetTokenExpiryHours} hora(s).</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no será modificada.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña - CMMS Hidrobombas',
      html,
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>¡Bienvenido! - CMMS Hidrobombas</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">¡Bienvenido a CMMS Hidrobombas!</h2>
          
          <p>Hola <strong>${username}</strong>,</p>
          
          <p>¡Tu cuenta ha sido verificada exitosamente! Ya puedes acceder a todas las funcionalidades del sistema CMMS.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.app.frontendUrl}/login" 
               style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          
          <p>Con tu cuenta puedes:</p>
          <ul style="color: #555;">
            <li>Gestionar reportes de mantenimiento</li>
            <li>Administrar equipos e instalaciones</li>
            <li>Generar reportes en PDF</li>
            <li>Y mucho más...</li>
          </ul>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Gracias por confiar en CMMS Hidrobombas para tu gestión de mantenimiento.
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '¡Bienvenido a CMMS Hidrobombas!',
      html,
    });
  }
}