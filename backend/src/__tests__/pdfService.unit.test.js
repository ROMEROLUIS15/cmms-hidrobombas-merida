const { buildReportPDF } = require('../services/pdfService');
const { ServiceReport } = require('../models');

jest.mock('../models');
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const doc = {
      y: 0,
      page: { width: 595, margins: { left: 40, right: 40, top: 40, bottom: 40 }, height: 842 },
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
    return doc;
  });
});

describe('PDF Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if report is not found', async () => {
    ServiceReport.findByPk.mockResolvedValue(null);

    await expect(buildReportPDF('123')).rejects.toThrow('Reporte no encontrado');
  });

  it('should build a PDF document if report is found', async () => {
    const mockReport = {
      id: '123',
      reportNumber: 'SRV-0001',
      reportDate: new Date(),
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

    const doc = await buildReportPDF('123');

    expect(ServiceReport.findByPk).toHaveBeenCalledWith('123', expect.any(Object));
    expect(doc.end).toHaveBeenCalled(); // Ensure the document stream is finalized
  });
  
  it('should handle missing JSON fields gracefully', async () => {
    const mockReport = {
      id: '123',
      // Missing data fields
      reportDate: null,
      visitType: null
    };
    
    ServiceReport.findByPk.mockResolvedValue(mockReport);

    const doc = await buildReportPDF('123');
    expect(doc.end).toHaveBeenCalled();
  });
});
