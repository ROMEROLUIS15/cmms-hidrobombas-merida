jest.mock('@langchain/core/vectorstores', () => {
  const mockMemoryVectorStore = jest.fn().mockImplementation(() => ({
    addDocuments: jest.fn().mockResolvedValue(undefined),
    similaritySearch: jest.fn().mockResolvedValue([]),
  }));
  return { MemoryVectorStore: mockMemoryVectorStore };
});

jest.mock('../ai/config', () => ({
  createEmbeddings: jest.fn(() => ({ _mockEmbeddings: true })),
}));
jest.mock('../models', () => ({
  ServiceReport: { findAll: jest.fn() },
  Equipment: {},
}));

const { createEmbeddings } = require('../ai/config');
const { ServiceReport } = require('../models');
const {
  getOrCreateVectorStore,
  searchSimilarReports,
  clearVectorStore,
} = require('../ai/vectorStore');

describe('AI VectorStore Unit Tests', () => {
  const mockReports = [
    {
      id: 'r1',
      reportNumber: 'RPT-001',
      reportDate: '2024-01-15',
      visitType: 'Correctivo',
      description: 'Motor sobrecalentado',
      observations: 'Temperatura alta en bobinado',
      recommendations: 'Revisar ventilación',
      partsUsed: 'Rodamiento 6205',
      waterEnergyData: { pressure: 4.5 },
      motorsData: [{ temp: 85 }],
      controlData: { status: 'fault' },
      systemName: 'Hidroneumático',
      technicianName: 'Carlos Pérez',
      equipment: {
        id: 'eq-1',
        name: 'Bomba Centrífuga',
        type: 'Centrífuga',
        brand: 'Grundfos',
        serialNumber: 'SN-001',
      },
    },
    {
      id: 'r2',
      reportNumber: 'RPT-002',
      reportDate: '2024-02-20',
      visitType: 'Preventivo',
      description: 'Mantenimiento general',
      observations: 'Todo en orden',
      recommendations: 'Cambiar aceite en 3 meses',
      partsUsed: 'Aceite ISO 32',
      waterEnergyData: {},
      motorsData: [],
      controlData: {},
      systemName: 'Sistema de Riego',
      technicianName: 'Juan López',
      equipment: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearVectorStore();
  });

  describe('getOrCreateVectorStore', () => {
    it('should create a new MemoryVectorStore and populate with reports', async () => {
      ServiceReport.findAll.mockResolvedValue(mockReports);

      const store = await getOrCreateVectorStore();

      expect(createEmbeddings).toHaveBeenCalledTimes(1);
      expect(ServiceReport.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({ model: expect.anything(), as: 'equipment' }),
          ]),
          order: [['createdAt', 'DESC']],
        })
      );
      expect(store.addDocuments).toHaveBeenCalledTimes(1);
      expect(store.addDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            pageContent: expect.stringContaining('RPT-001'),
            metadata: expect.objectContaining({ reportNumber: 'RPT-001' }),
          }),
          expect.objectContaining({
            pageContent: expect.stringContaining('RPT-002'),
            metadata: expect.objectContaining({ reportNumber: 'RPT-002' }),
          }),
        ])
      );
      expect(store).toBeDefined();
    });

    it('should return existing store on subsequent calls', async () => {
      ServiceReport.findAll.mockResolvedValue(mockReports);

      const store1 = await getOrCreateVectorStore();
      const store2 = await getOrCreateVectorStore();

      expect(store1).toBe(store2);
      expect(ServiceReport.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle empty reports list', async () => {
      ServiceReport.findAll.mockResolvedValue([]);

      const store = await getOrCreateVectorStore();

      expect(store.addDocuments).not.toHaveBeenCalled();
    });
  });

  describe('searchSimilarReports', () => {
    it('should call similaritySearch on the store with the query and k', async () => {
      ServiceReport.findAll.mockResolvedValue(mockReports);

      const results = await searchSimilarReports('motor vibration', 3);

      expect(results).toBeDefined();
    });

    it('should use default k=5 when not specified', async () => {
      ServiceReport.findAll.mockResolvedValue(mockReports);

      const results = await searchSimilarReports('test');

      expect(results).toBeDefined();
    });
  });

  describe('clearVectorStore', () => {
    it('should reset the store so next getOrCreateVectorStore creates a new one', async () => {
      ServiceReport.findAll.mockResolvedValue(mockReports);

      const store1 = await getOrCreateVectorStore();
      clearVectorStore();
      const store2 = await getOrCreateVectorStore();

      expect(store1).not.toBe(store2);
      expect(ServiceReport.findAll).toHaveBeenCalledTimes(2);
    });
  });
});
