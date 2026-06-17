const { downloadReportPDF, sendReportByEmail } = require('../controllers/pdfController');
const { buildReportPDF } = require('../services/pdfService');
const { sendServiceReportEmail } = require('../services/emailService');
const { ServiceReport } = require('../models');

jest.mock('../services/pdfService');
jest.mock('../services/emailService', () => ({
  sendServiceReportEmail: jest.fn()
}));
jest.mock('../models', () => ({
  ServiceReport: { findByPk: jest.fn() },
  Equipment: {},
  Client: {},
  User: {},
  TechnicianEquipment: { findAll: jest.fn() }
}));

describe('PDF Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Usuario privilegiado: omite la verificación de ownership.
    req = { params: {}, user: { role: 'admin' } };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    ServiceReport.findByPk.mockResolvedValue({ id: 'test-uuid-123', userId: 'u1', equipmentId: 'e1' });
  });

  describe('downloadReportPDF', () => {
    it('should generate PDF, set headers, and pipe to response', async () => {
      req.params = { id: 'test-uuid-123' };
      const mockDoc = { pipe: jest.fn() };
      buildReportPDF.mockResolvedValue(mockDoc);

      await downloadReportPDF(req, res);

      expect(buildReportPDF).toHaveBeenCalledWith('test-uuid-123');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="reporte_test-uuid-123.pdf"');
      expect(mockDoc.pipe).toHaveBeenCalledWith(res);
    });

    it('should pass error to error handler if buildReportPDF fails', async () => {
      req.params = { id: 'test-uuid-123' };
      const error = new Error('Generation failed');
      buildReportPDF.mockRejectedValue(error);

      await expect(downloadReportPDF(req, res)).rejects.toThrow('Generation failed');
    });
  });

  describe('sendReportByEmail', () => {
    beforeEach(() => {
      req.body = {};
      ServiceReport.findByPk.mockResolvedValue({
        id: 'test-uuid-123',
        userId: 'u1',
        equipmentId: 'e1',
        reportNumber: 'SRV-0001',
        equipment: { client: { name: 'Cliente Demo' } }
      });
    });

    it('should return 400 when no recipient email is provided', async () => {
      req.params = { id: 'test-uuid-123' };
      req.body = {};

      await sendReportByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(sendServiceReportEmail).not.toHaveBeenCalled();
    });

    it('should accept recipientEmail (the field the frontend actually sends)', async () => {
      req.params = { id: 'test-uuid-123' };
      req.body = { recipientEmail: 'cliente@example.com', recipientName: 'Juan Pérez' };
      sendServiceReportEmail.mockResolvedValue({ success: true, messageId: 'msg-1' });

      await sendReportByEmail(req, res);

      expect(sendServiceReportEmail).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-uuid-123' }),
        'cliente@example.com',
        'Juan Pérez'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should still accept legacy clientEmail field', async () => {
      req.params = { id: 'test-uuid-123' };
      req.body = { clientEmail: 'legacy@example.com' };
      sendServiceReportEmail.mockResolvedValue({ success: true, messageId: 'msg-2' });

      await sendReportByEmail(req, res);

      expect(sendServiceReportEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'legacy@example.com',
        'Cliente Demo'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should report simulated email when SMTP is not configured', async () => {
      req.params = { id: 'test-uuid-123' };
      req.body = { recipientEmail: 'cliente@example.com' };
      sendServiceReportEmail.mockResolvedValue({ simulated: true });

      await sendReportByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ simulated: true }));
    });

    it('should return 404 when the report does not exist', async () => {
      req.params = { id: 'missing' };
      req.body = { recipientEmail: 'cliente@example.com' };
      ServiceReport.findByPk.mockResolvedValue(null);

      await sendReportByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(sendServiceReportEmail).not.toHaveBeenCalled();
    });
  });
});
