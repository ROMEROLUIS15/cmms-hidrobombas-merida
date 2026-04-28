const { downloadReportPDF } = require('../controllers/pdfController');
const { buildReportPDF } = require('../services/pdfService');

jest.mock('../services/pdfService');

describe('PDF Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
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
});
