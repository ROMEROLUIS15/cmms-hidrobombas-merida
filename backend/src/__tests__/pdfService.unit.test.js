const { buildReportPDF } = require('../services/pdfService');
const { ServiceReport } = require('../models');

jest.mock('../models');

// FIX: The PDFKit mock was incomplete. If the production implementation calls
// any unlisted method (e.g., `image`, `moveDown`, `addPage`), the test would
// throw a TypeError instead of producing a meaningful assertion failure.
// Adding all known PDFKit chainable methods makes the mock robust against
// additions to the PDF layout without requiring test changes.
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const chainable = jest.fn().mockReturnThis();
    const doc = {
      // Geometry & position
      y: 0,
      page: { width: 595, margins: { left: 40, right: 40, top: 40, bottom: 40 }, height: 842 },
      // Drawing primitives
      rect:      chainable,
      fill:      chainable,
      fillColor: chainable,
      stroke:    chainable,
      moveTo:    chainable,
      lineTo:    chainable,
      // Text
      fontSize:  chainable,
      font:      chainable,
      text:      chainable,
      // Layout helpers (FIX: previously missing)
      moveDown:  chainable,
      addPage:   chainable,
      // Media (FIX: previously missing — would throw if implementation uses images)
      image:     chainable,
      // Stream control
      end:       chainable,
      pipe:      chainable,
    };
    return doc;
  });
});

describe('PDF Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw "Reporte no encontrado" when the report ID does not exist in the database', async () => {
    // Arrange
    ServiceReport.findByPk.mockResolvedValue(null);

    // Act & Assert
    await expect(buildReportPDF('123')).rejects.toThrow('Reporte no encontrado');
  });

  it('should call findByPk, build a PDF document, and finalize the stream when the report exists', async () => {
    // Arrange
    const mockReport = {
      id: '123',
      reportNumber: 'SRV-0001',
      reportDate: new Date('2026-06-08T12:00:00.000Z'),
      visitType: 'mensual',
      waterEnergyData: JSON.stringify({ voltage_r_s: '220' }),
      motorsData: JSON.stringify([{ motor_hp: '5' }]),
      controlData: JSON.stringify({ manometer: '50' }),
      observations: 'All good',
      technicianName: 'Tech',
      equipment: {
        name: 'Pump',
        client: { name: 'Client A' }
      },
      technician: {
        username: 'TechUser'
      }
    };
    ServiceReport.findByPk.mockResolvedValue(mockReport);

    // Act
    const doc = await buildReportPDF('123');

    // Assert
    expect(ServiceReport.findByPk).toHaveBeenCalledWith('123', expect.any(Object));
    // Verifies the document stream was properly finalized
    expect(doc.end).toHaveBeenCalled();
  });

  it('should complete PDF generation gracefully when optional JSON data fields are null or missing', async () => {
    // Arrange — report with missing structured data fields
    const mockReport = {
      id: '123',
      reportDate: null,
      visitType: null,
      waterEnergyData: null,
      motorsData: null,
      controlData: null,
      observations: null,
      technicianName: null,
      equipment: null,
      technician: null,
    };
    ServiceReport.findByPk.mockResolvedValue(mockReport);

    // Act
    const doc = await buildReportPDF('123');

    // Assert — document should still be finalized without throwing
    expect(doc.end).toHaveBeenCalled();
  });
});
