jest.mock('../ai/ragChain', () => ({
  getRAGChain: jest.fn(),
  clearRAGChain: jest.fn(),
}));

jest.mock('../ai/assistantGraph', () => ({
  askAssistant: jest.fn(),
}));

jest.mock('../ai/diagnosticGraph', () => ({
  runDiagnostic: jest.fn(),
}));

jest.mock('../ai/vectorStore', () => ({
  getOrCreateVectorStore: jest.fn(),
  clearVectorStore: jest.fn(),
}));

const { getRAGChain, clearRAGChain } = require('../ai/ragChain');
const { askAssistant } = require('../ai/assistantGraph');
const { runDiagnostic } = require('../ai/diagnosticGraph');
const { getOrCreateVectorStore, clearVectorStore } = require('../ai/vectorStore');
const { askQuestion, diagnose, chat, reindexReports } = require('../ai/index');

describe('AI Index Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('askQuestion', () => {
    it('should invoke the RAG chain with the question and return the result', async () => {
      const mockChain = { invoke: jest.fn().mockResolvedValue('RAG answer') };
      getRAGChain.mockResolvedValue(mockChain);

      const result = await askQuestion('What is a centrifugal pump?');

      expect(getRAGChain).toHaveBeenCalledTimes(1);
      expect(mockChain.invoke).toHaveBeenCalledWith('What is a centrifugal pump?');
      expect(result).toBe('RAG answer');
    });

    it('should propagate errors from the chain', async () => {
      const mockChain = { invoke: jest.fn().mockRejectedValue(new Error('Chain failed')) };
      getRAGChain.mockResolvedValue(mockChain);

      await expect(askQuestion('test')).rejects.toThrow('Chain failed');
    });
  });

  describe('diagnose', () => {
    it('should call runDiagnostic with equipmentId, equipmentName, and symptoms', async () => {
      runDiagnostic.mockResolvedValue({
        diagnosis: 'Motor bearing failure',
        recommendations: 'Replace bearings',
        followUpQuestion: null,
      });

      const result = await diagnose({
        equipmentId: 'eq-1',
        equipmentName: 'Centrifugal Pump',
        symptoms: 'Vibration and noise',
      });

      expect(runDiagnostic).toHaveBeenCalledWith({
        equipmentId: 'eq-1',
        equipmentName: 'Centrifugal Pump',
        symptoms: 'Vibration and noise',
      });
      expect(result).toEqual({
        diagnosis: 'Motor bearing failure',
        recommendations: 'Replace bearings',
        followUpQuestion: null,
      });
    });

    it('should handle missing optional fields', async () => {
      runDiagnostic.mockResolvedValue({
        diagnosis: 'Check fluid levels',
        recommendations: 'Refill hydraulic oil',
        followUpQuestion: 'Is the oil temperature normal?',
      });

      const result = await diagnose({ symptoms: 'Low pressure' });

      expect(runDiagnostic).toHaveBeenCalledWith({
        equipmentId: undefined,
        equipmentName: undefined,
        symptoms: 'Low pressure',
      });
      expect(result.followUpQuestion).toBeTruthy();
    });
  });

  describe('chat', () => {
    it('should delegate to askAssistant with the message', async () => {
      askAssistant.mockResolvedValue('Assistant response');

      const result = await chat('Hello');

      expect(askAssistant).toHaveBeenCalledWith('Hello');
      expect(result).toBe('Assistant response');
    });

    it('should propagate errors from askAssistant', async () => {
      askAssistant.mockRejectedValue(new Error('Assistant error'));

      await expect(chat('Hi')).rejects.toThrow('Assistant error');
    });
  });

  describe('reindexReports', () => {
    it('should clear vector store and RAG chain, then rebuild vector store', async () => {
      getOrCreateVectorStore.mockResolvedValue('new-store');

      await reindexReports();

      expect(clearVectorStore).toHaveBeenCalledTimes(1);
      expect(clearRAGChain).toHaveBeenCalledTimes(1);
      expect(getOrCreateVectorStore).toHaveBeenCalledTimes(1);
    });

    it('should re-create vector store even if clearing throws', async () => {
      clearVectorStore.mockImplementation(() => { throw new Error('clear error'); });
      getOrCreateVectorStore.mockResolvedValue('rebuilt');

      await expect(reindexReports()).rejects.toThrow('clear error');
    });
  });
});
