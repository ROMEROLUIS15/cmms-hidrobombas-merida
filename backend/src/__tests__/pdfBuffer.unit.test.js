// Usa PDFKit REAL (sin mock) para verificar que buildReportPDFBuffer produce
// un Buffer de PDF válido — el que se adjunta al email.
const { buildReportPDFBuffer } = require('../services/pdfService');
const { ServiceReport } = require('../models');

jest.mock('../models');

describe('buildReportPDFBuffer (PDF real)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resuelve un Buffer de PDF no vacío con cabecera %PDF-', async () => {
    ServiceReport.findByPk.mockResolvedValue({
      id: '123',
      reportNumber: 'SRV-0001',
      reportDate: new Date('2026-06-08T12:00:00.000Z'),
      visitType: 'mensual',
      waterEnergyData: null,
      motorsData: null,
      controlData: null,
      observations: 'ok',
      technicianName: 'Tech',
      clientSignature: null,
      clientSignatureName: null,
      equipment: { name: 'Pump', client: { name: 'Client A' } },
      technician: { username: 'TechUser' },
    });

    const buf = await buildReportPDFBuffer('123');

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(100);
    expect(buf.slice(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('propaga el error si el reporte no existe', async () => {
    ServiceReport.findByPk.mockResolvedValue(null);
    await expect(buildReportPDFBuffer('nope')).rejects.toThrow('Reporte no encontrado');
  });
});
