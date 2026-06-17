// Verifica que sendServiceReportEmail genera el PDF y lo ADJUNTA al correo,
// pasándolo correctamente al proveedor (SMTP/nodemailer en este test).
const nodemailer = require('nodemailer');

jest.mock('nodemailer');
jest.mock('../services/pdfService', () => ({
  buildReportPDFBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF-fake-content')),
}));

const { sendServiceReportEmail } = require('../services/emailService');
const { buildReportPDFBuffer } = require('../services/pdfService');

describe('sendServiceReportEmail — adjunta el PDF', () => {
  const ORIGINAL_ENV = process.env;
  let sendMail;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, SMTP_USER: 'tech@gmail.com', SMTP_PASS: 'app-pass', SMTP_FROM: 'tech@gmail.com' };
    delete process.env.EMAIL_DEV_OVERRIDE_TO;
    delete process.env.RESEND_DEV_OVERRIDE_TO;
    sendMail = jest.fn().mockResolvedValue({ messageId: 'mid-123' });
    nodemailer.createTransport.mockReturnValue({ sendMail });
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  const report = {
    id: 'r1',
    reportNumber: 'SRV-0007',
    reportDate: new Date('2026-06-08T12:00:00.000Z'),
    visitType: 'mensual',
    equipment: { name: 'Pump', client: { name: 'Cliente A' } },
    technician: { username: 'Tech' },
  };

  it('genera el PDF y lo envía como adjunto al destinatario', async () => {
    const result = await sendServiceReportEmail(report, 'cliente@example.com', 'Cliente');

    expect(buildReportPDFBuffer).toHaveBeenCalledWith('r1');
    expect(result.success).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);

    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('cliente@example.com');
    expect(message.attachments).toEqual([
      expect.objectContaining({ filename: 'Reporte_SRV-0007.pdf', content: expect.any(Buffer) }),
    ]);
  });

  it('si el PDF falla, envía el correo igualmente (sin adjunto)', async () => {
    buildReportPDFBuffer.mockRejectedValueOnce(new Error('PDF boom'));

    const result = await sendServiceReportEmail(report, 'cliente@example.com', 'Cliente');

    expect(result.success).toBe(true);
    const message = sendMail.mock.calls[0][0];
    expect(message.attachments).toBeUndefined();
  });
});
