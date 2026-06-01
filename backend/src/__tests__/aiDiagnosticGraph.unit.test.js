const { Op } = require('sequelize');

const mockCompiledGraph = { invoke: jest.fn() };

const mockStateGraphInstance = {
  addNode: jest.fn().mockReturnThis(),
  addEdge: jest.fn().mockReturnThis(),
  addConditionalEdges: jest.fn().mockReturnThis(),
  compile: jest.fn().mockReturnValue(mockCompiledGraph),
};

const mockAnnotationFn = jest.fn();
const mockAnnotation = Object.assign(mockAnnotationFn, {
  Root: jest.fn(() => ({})),
});

jest.mock('@langchain/langgraph', () => ({
  StateGraph: jest.fn(() => mockStateGraphInstance),
  START: 'START',
  END: 'END',
  Annotation: mockAnnotation,
}));

jest.mock('../ai/config', () => ({
  createLLM: jest.fn(),
}));

jest.mock('../ai/vectorStore', () => ({
  searchSimilarReports: jest.fn(),
}));

const mockEquipmentFindOne = jest.fn();
jest.mock('../models', () => ({
  Equipment: { findOne: mockEquipmentFindOne },
  Client: {},
  ServiceReport: {},
}));

const { createLLM } = require('../ai/config');
const { searchSimilarReports } = require('../ai/vectorStore');
const { runDiagnostic } = require('../ai/diagnosticGraph');

const retrieveEquipmentFn = mockStateGraphInstance.addNode.mock.calls.find(
  ([name]) => name === 'retrieveEquipment'
)[1];
const searchHistoryFn = mockStateGraphInstance.addNode.mock.calls.find(
  ([name]) => name === 'searchHistory'
)[1];
const generateDiagnosisFn = mockStateGraphInstance.addNode.mock.calls.find(
  ([name]) => name === 'generateDiagnosis'
)[1];
const recommendActionsFn = mockStateGraphInstance.addNode.mock.calls.find(
  ([name]) => name === 'recommendActions'
)[1];
const askFollowUpFn = mockStateGraphInstance.addNode.mock.calls.find(
  ([name]) => name === 'askFollowUp'
)[1];
const needsMoreInfoFn = mockStateGraphInstance.addConditionalEdges.mock.calls[0][1];

describe('AI Diagnostic Graph Unit Tests', () => {
  describe('module-level graph construction', () => {
    it('should construct graph with correct nodes and edges', () => {
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('retrieveEquipment', expect.any(Function));
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('searchHistory', expect.any(Function));
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('askFollowUp', expect.any(Function));
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('generateDiagnosis', expect.any(Function));
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('recommendActions', expect.any(Function));
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('START', 'retrieveEquipment');
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('retrieveEquipment', 'searchHistory');
      expect(mockStateGraphInstance.addConditionalEdges).toHaveBeenCalledWith(
        'searchHistory',
        expect.any(Function),
        { askFollowUp: 'askFollowUp', generateDiagnosis: 'generateDiagnosis' }
      );
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('askFollowUp', 'generateDiagnosis');
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('generateDiagnosis', 'recommendActions');
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('recommendActions', 'END');
      expect(mockStateGraphInstance.compile).toHaveBeenCalledTimes(1);
    });
  });

  describe('runtime behavior', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('runDiagnostic', () => {
      it('should invoke the graph with provided params and return diagnosis, recommendations, followUpQuestion', async () => {
        mockCompiledGraph.invoke.mockResolvedValue({
          diagnosis: 'Bearing failure detected',
          recommendations: 'Replace bearing 6205',
          followUpQuestion: 'Is there unusual vibration?',
        });

        const result = await runDiagnostic({
          equipmentId: 'eq-1',
          equipmentName: 'Centrifugal Pump',
          symptoms: 'Vibration and noise',
        });

        expect(mockCompiledGraph.invoke).toHaveBeenCalledWith({
          equipmentId: 'eq-1',
          equipmentName: 'Centrifugal Pump',
          symptoms: 'Vibration and noise',
        });
        expect(result).toEqual({
          diagnosis: 'Bearing failure detected',
          recommendations: 'Replace bearing 6205',
          followUpQuestion: 'Is there unusual vibration?',
        });
      });

      it('should default empty strings when fields are missing', async () => {
        mockCompiledGraph.invoke.mockResolvedValue({
          diagnosis: 'No diagnosis',
          recommendations: 'No recommendations',
        });

        const result = await runDiagnostic({});

        expect(mockCompiledGraph.invoke).toHaveBeenCalledWith({
          equipmentId: '',
          equipmentName: '',
          symptoms: '',
        });
        expect(result.followUpQuestion).toBeNull();
      });

      it('should use default messages when result fields are missing', async () => {
        mockCompiledGraph.invoke.mockResolvedValue({});

        const result = await runDiagnostic({ symptoms: 'test' });

        expect(result.diagnosis).toBe('No se pudo generar diagnóstico.');
        expect(result.recommendations).toBe('No se pudieron generar recomendaciones.');
        expect(result.followUpQuestion).toBeNull();
      });
    });

    describe('retrieveEquipment node', () => {
      it('should return equipment info when found', async () => {
        const mockEquipment = { id: 'eq-1', name: 'Bomba', client: { name: 'Cliente A' } };
        mockEquipmentFindOne.mockResolvedValue(mockEquipment);

        const result = await retrieveEquipmentFn({
          equipmentId: 'eq-1',
          equipmentName: '',
        });

        expect(mockEquipmentFindOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { [Op.or]: [{ id: 'eq-1' }, { name: { [Op.like]: '%eq-1%' } }] },
          })
        );
        expect(result.equipmentInfo).toBe(JSON.stringify(mockEquipment, null, 2));
      });

      it('should return "not found" message when equipment is null', async () => {
        mockEquipmentFindOne.mockResolvedValue(null);

        const result = await retrieveEquipmentFn({
          equipmentId: 'eq-99',
          equipmentName: '',
        });

        expect(result.equipmentInfo).toBe('Equipo no encontrado en la base de datos.');
      });

      it('should return error message on exception', async () => {
        mockEquipmentFindOne.mockRejectedValue(new Error('DB error'));

        const result = await retrieveEquipmentFn({
          equipmentId: 'eq-1',
          equipmentName: '',
        });

        expect(result.equipmentInfo).toBe('Error al consultar equipo: DB error');
      });

      it('should handle missing query gracefully', async () => {
        const result = await retrieveEquipmentFn({ equipmentId: '', equipmentName: '' });

        expect(result.equipmentInfo).toBe('No se proporcionó ID o nombre del equipo.');
        expect(mockEquipmentFindOne).not.toHaveBeenCalled();
      });
    });

    describe('searchHistory node', () => {
      it('should search similar reports and format results', async () => {
        searchSimilarReports.mockResolvedValue([
          {
            metadata: { reportNumber: 'RPT-001', reportDate: '2024-01-15', equipmentName: 'Bomba' },
            pageContent: 'Motor overheating issue',
          },
          {
            metadata: { reportNumber: 'RPT-002', reportDate: '2024-02-20', equipmentName: 'Bomba' },
            pageContent: 'Vibration analysis completed',
          },
        ]);

        const result = await searchHistoryFn({
          symptoms: 'overheating vibration',
          equipmentName: 'Bomba',
        });

        expect(searchSimilarReports).toHaveBeenCalledWith('overheating vibration Bomba', 3);
        expect(result.historicalReports).toContain('RPT-001');
        expect(result.historicalReports).toContain('RPT-002');
        expect(result.historicalReports).toContain('Motor overheating issue');
      });

      it('should return no data message on empty query', async () => {
        const result = await searchHistoryFn({ symptoms: '', equipmentName: '' });

        expect(result.historicalReports).toBe('No hay datos para buscar en el historial.');
        expect(searchSimilarReports).not.toHaveBeenCalled();
      });

      it('should return no results message when no similar reports found', async () => {
        searchSimilarReports.mockResolvedValue([]);

        const result = await searchHistoryFn({ symptoms: 'unknown', equipmentName: '' });

        expect(result.historicalReports).toBe('No se encontraron reportes históricos similares.');
      });

      it('should handle search errors gracefully', async () => {
        searchSimilarReports.mockRejectedValue(new Error('Search failed'));

        const result = await searchHistoryFn({ symptoms: 'test', equipmentName: '' });

        expect(result.historicalReports).toBe('Error al buscar historial: Search failed');
      });
    });

    describe('needsMoreInfo (conditional edge)', () => {
      it('should return "askFollowUp" when no equipment info', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: '',
          symptoms: 'Long symptom description here...',
          historicalReports: 'Some history data with enough length...',
        });

        expect(decision).toBe('askFollowUp');
      });

      it('should return "askFollowUp" when equipment info contains "no encontrado"', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: 'Equipo no encontrado en la base de datos.',
          symptoms: 'Long symptom description here...',
          historicalReports: 'Some history data with enough length...',
        });

        expect(decision).toBe('askFollowUp');
      });

      it('should return "askFollowUp" when equipment info contains "Error"', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: 'Error al consultar equipo: timeout',
          symptoms: 'Long symptom description here...',
          historicalReports: 'Some history data with enough length...',
        });

        expect(decision).toBe('askFollowUp');
      });

      it('should return "askFollowUp" when symptoms are too short (<=10 chars)', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: '{"id":"eq-1","name":"Bomba"}',
          symptoms: 'short',
          historicalReports: 'Some history data with enough length...',
        });

        expect(decision).toBe('askFollowUp');
      });

      it('should return "askFollowUp" when historical reports are too short (<=20 chars)', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: '{"id":"eq-1","name":"Bomba"}',
          symptoms: 'This is a long symptom description with enough characters...',
          historicalReports: 'Short',
        });

        expect(decision).toBe('askFollowUp');
      });

      it('should return "askFollowUp" when historical reports are undefined', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: '{"id":"eq-1","name":"Bomba"}',
          symptoms: 'This is a long symptom description with enough characters...',
          historicalReports: undefined,
        });

        expect(decision).toBe('askFollowUp');
      });

      it('should return "generateDiagnosis" when all conditions are met', () => {
        const decision = needsMoreInfoFn({
          equipmentInfo: '{"id":"eq-1","name":"Bomba"}',
          symptoms: 'This is a long symptom description with enough characters to pass the length check...',
          historicalReports: 'Some long enough historical data that is definitely more than 20 characters...',
        });

        expect(decision).toBe('generateDiagnosis');
      });
    });

    describe('generateDiagnosis node', () => {
      it('should invoke LLM with diagnosis prompt and return diagnosis', async () => {
        const mockLLM = { invoke: jest.fn().mockResolvedValue({ content: 'Cavitation detected in pump impeller.' }) };
        createLLM.mockReturnValue(mockLLM);

        const result = await generateDiagnosisFn({
          symptoms: 'Noise and vibration',
          equipmentInfo: 'Centrifugal Pump',
          historicalReports: 'Similar issues found',
        });

        expect(createLLM).toHaveBeenCalledTimes(1);
        expect(mockLLM.invoke).toHaveBeenCalledWith([
          { role: 'user', content: expect.stringContaining('SÍNTOMAS REPORTADOS') },
        ]);
        expect(mockLLM.invoke.mock.calls[0][0][0].content).toContain('Noise and vibration');
        expect(result.diagnosis).toBe('Cavitation detected in pump impeller.');
      });

      it('should handle missing data gracefully in prompt', async () => {
        const mockLLM = { invoke: jest.fn().mockResolvedValue({ content: 'Diagnosis result' }) };
        createLLM.mockReturnValue(mockLLM);

        const result = await generateDiagnosisFn({
          symptoms: undefined,
          equipmentInfo: undefined,
          historicalReports: undefined,
        });

        expect(mockLLM.invoke).toHaveBeenCalledWith([
          { role: 'user', content: expect.stringContaining('No especificados') },
        ]);
        expect(result.diagnosis).toBe('Diagnosis result');
      });
    });

    describe('recommendActions node', () => {
      it('should invoke LLM with recommendation prompt', async () => {
        const mockLLM = { invoke: jest.fn().mockResolvedValue({ content: 'Replace impeller and check alignment.' }) };
        createLLM.mockReturnValue(mockLLM);

        const result = await recommendActionsFn({
          diagnosis: 'Cavitation detected',
          equipmentInfo: 'Centrifugal Pump',
        });

        expect(createLLM).toHaveBeenCalledTimes(1);
        expect(mockLLM.invoke).toHaveBeenCalledWith([
          { role: 'user', content: expect.stringContaining('DIAGNÓSTICO') },
        ]);
        expect(mockLLM.invoke.mock.calls[0][0][0].content).toContain('Cavitation detected');
        expect(result.recommendations).toBe('Replace impeller and check alignment.');
      });
    });

    describe('askFollowUp node', () => {
      it('should invoke LLM with follow-up question prompt', async () => {
        const mockLLM = { invoke: jest.fn().mockResolvedValue({ content: '¿Has medido la corriente del motor?' }) };
        createLLM.mockReturnValue(mockLLM);

        const result = await askFollowUpFn({
          symptoms: 'Motor overheats',
          equipmentInfo: 'Motor 50HP',
        });

        expect(createLLM).toHaveBeenCalledTimes(1);
        expect(mockLLM.invoke).toHaveBeenCalledWith([
          { role: 'user', content: expect.stringContaining('SÍNTOMAS') },
        ]);
        expect(mockLLM.invoke.mock.calls[0][0][0].content).toContain('Motor overheats');
        expect(result.followUpQuestion).toBe('¿Has medido la corriente del motor?');
      });
    });
  });
});
