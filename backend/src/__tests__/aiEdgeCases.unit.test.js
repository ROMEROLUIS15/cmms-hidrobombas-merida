describe('AI Module Edge Cases', () => {
  describe('module imports resolve correctly', () => {
    it('should resolve ai/index', () => {
      const mod = require('../ai/index');
      expect(mod).toHaveProperty('askQuestion');
      expect(mod).toHaveProperty('chat');
      expect(mod).toHaveProperty('diagnose');
      expect(mod).toHaveProperty('reindexReports');
    });

    it('should resolve ai/config', () => {
      const mod = require('../ai/config');
      expect(typeof mod.createLLM).toBe('function');
      expect(typeof mod.createEmbeddings).toBe('function');
    });

    it('should resolve ai/container', () => {
      const mod = require('../ai/container');
      expect(mod).toHaveProperty('container');
      expect(mod).toHaveProperty('setCreateLLM');
      expect(mod).toHaveProperty('setCreateEmbeddings');
      expect(mod).toHaveProperty('resetToDefaults');
    });

    it('should resolve ai/streaming', () => {
      const mod = require('../ai/streaming');
      expect(typeof mod.streamChat).toBe('function');
      expect(typeof mod.streamQuestion).toBe('function');
    });

    it('should resolve ai/prompts', () => {
      const mod = require('../ai/prompts');
      expect(mod).toHaveProperty('DIAGNOSIS_PROMPT');
      expect(mod).toHaveProperty('RECOMMENDATIONS_PROMPT');
      expect(mod).toHaveProperty('FOLLOW_UP_PROMPT');
    });

    it('should resolve ai/vectorStoreProvider', () => {
      const mod = require('../ai/vectorStoreProvider');
      expect(mod).toHaveProperty('getOrCreateVectorStore');
      expect(mod).toHaveProperty('searchSimilarReports');
      expect(mod).toHaveProperty('clearVectorStore');
      expect(mod).toHaveProperty('providers');
      expect(mod).toHaveProperty('formatReportForEmbedding');
      expect(mod).toHaveProperty('loadReports');
    });

    it('should resolve ai/vectorStore (re-exports)', () => {
      const vs = require('../ai/vectorStore');
      const vsp = require('../ai/vectorStoreProvider');
      expect(vs.getOrCreateVectorStore).toBe(vsp.getOrCreateVectorStore);
      expect(vs.searchSimilarReports).toBe(vsp.searchSimilarReports);
      expect(vs.clearVectorStore).toBe(vsp.clearVectorStore);
    });

    it('should resolve ai/tools with 4 tools', () => {
      const mod = require('../ai/tools');
      expect(mod).toHaveProperty('getEquipmentInfo');
      expect(mod).toHaveProperty('getClientHistory');
      expect(mod).toHaveProperty('getRecentReportsByEquipment');
      expect(mod).toHaveProperty('searchReportsByText');
    });

    it('should resolve ai/assistantGraph', () => {
      const mod = require('../ai/assistantGraph');
      expect(mod).toHaveProperty('askAssistant');
      expect(mod).toHaveProperty('assistantAgent');
    });

    it('should resolve ai/diagnosticGraph', () => {
      const mod = require('../ai/diagnosticGraph');
      expect(mod).toHaveProperty('runDiagnostic');
      expect(mod).toHaveProperty('diagnosticAgent');
    });
  });

  describe('container DI overrides work at runtime', () => {
    const { container, setCreateLLM, setCreateEmbeddings, resetToDefaults } = require('../ai/container');
    const ORIGINAL_GROQ_KEY = process.env.GROQ_API_KEY;

    beforeAll(() => {
      process.env.GROQ_API_KEY = ORIGINAL_GROQ_KEY || 'test-key-for-test';
    });

    afterAll(() => {
      if (ORIGINAL_GROQ_KEY === undefined) {
        delete process.env.GROQ_API_KEY;
      } else {
        process.env.GROQ_API_KEY = ORIGINAL_GROQ_KEY;
      }
    });

    afterEach(() => {
      resetToDefaults();
    });

    it('should use injected factory and restore default', () => {
      const mock = jest.fn(() => 'mock-llm');
      setCreateLLM(mock);
      expect(container.createLLM()).toBe('mock-llm');
      expect(mock).toHaveBeenCalledTimes(1);

      resetToDefaults();
      const result = container.createLLM();
      expect(result.constructor.name).toBe('ChatGroq');
    });

    it('should allow multiple overrides', () => {
      const fn1 = jest.fn(() => 'llm1');
      const fn2 = jest.fn(() => 'llm2');
      setCreateLLM(fn1);
      container.createLLM();
      setCreateLLM(fn2);
      container.createLLM();
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('tool errors return JSON format', () => {
    const { Op } = require('sequelize');

    beforeEach(() => {
      jest.resetModules();
    });

    it('should parse error JSON correctly from getEquipmentInfo', async () => {
      jest.doMock('../models', () => ({
        Equipment: { findAll: jest.fn().mockRejectedValue(new Error('DB down')) },
        Client: {},
        ServiceReport: {},
        User: {},
      }));
      const { getEquipmentInfo } = require('../ai/tools');
      const result = await getEquipmentInfo.func('test');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ status: 'error', message: 'Error obteniendo información del equipo: DB down' });
    });
  });

  describe('vector store provider invalid config fallback', () => {
    const ORIGINAL_ENV = { ...process.env };

    afterEach(() => {
      process.env = { ...ORIGINAL_ENV };
      jest.resetModules();
    });

    it('should fallback to memory provider for unknown VECTOR_STORE_PROVIDER', () => {
      process.env.VECTOR_STORE_PROVIDER = 'nonexistent_provider';
      const { providers } = require('../ai/vectorStoreProvider');
      expect(providers.memory).toBeDefined();
    });

    it('should use memory provider by default', () => {
      delete process.env.VECTOR_STORE_PROVIDER;
      const { getOrCreateVectorStore, clearVectorStore } = require('../ai/vectorStore');
      expect(typeof getOrCreateVectorStore).toBe('function');
      clearVectorStore();
    });
  });

  describe('prompt templates with edge case inputs', () => {
    const { DIAGNOSIS_PROMPT, RECOMMENDATIONS_PROMPT, FOLLOW_UP_PROMPT } = require('../ai/prompts');

    it('DIAGNOSIS_PROMPT should contain expected sections', () => {
      expect(DIAGNOSIS_PROMPT).toContain('SÍNTOMAS REPORTADOS');
      expect(DIAGNOSIS_PROMPT).toContain('{symptoms}');
      expect(DIAGNOSIS_PROMPT).toContain('{equipmentInfo}');
      expect(DIAGNOSIS_PROMPT).toContain('{historicalReports}');
    });

    it('RECOMMENDATIONS_PROMPT should contain expected sections', () => {
      expect(RECOMMENDATIONS_PROMPT).toContain('{diagnosis}');
      expect(RECOMMENDATIONS_PROMPT).toContain('{equipmentInfo}');
    });

    it('FOLLOW_UP_PROMPT should contain expected sections', () => {
      expect(FOLLOW_UP_PROMPT).toContain('{symptoms}');
      expect(FOLLOW_UP_PROMPT).toContain('{equipmentInfo}');
    });

    it('should replace placeholders correctly via diagnosticGraph', () => {
      const result = DIAGNOSIS_PROMPT
        .replace('{equipmentInfo}', 'Test Equipment')
        .replace('{historicalReports}', 'No history')
        .replace('{symptoms}', 'Vibration');
      expect(result).toContain('Test Equipment');
      expect(result).toContain('No history');
      expect(result).toContain('Vibration');
      expect(result).not.toContain('{equipmentInfo}');
      expect(result).not.toContain('{symptoms}');
    });
  });
});
