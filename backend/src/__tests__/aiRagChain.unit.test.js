const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

jest.mock('@langchain/core/prompts');
jest.mock('@langchain/core/output_parsers');
jest.mock('@langchain/core/runnables');
jest.mock('../ai/config', () => ({
  createLLM: jest.fn(() => ({ _mockLLM: true })),
}));
jest.mock('../ai/vectorStore', () => ({
  searchSimilarReports: jest.fn(),
}));

const { createLLM } = require('../ai/config');
const { searchSimilarReports } = require('../ai/vectorStore');
const { getRAGChain, clearRAGChain } = require('../ai/ragChain');

describe('AI RAG Chain Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRAGChain();
  });

  describe('getRAGChain', () => {
    it('should create a new RAG chain on first call', async () => {
      const mockLLM = { _mockLLM: true };
      createLLM.mockReturnValue(mockLLM);

      const mockPrompt = { _mockPrompt: true };
      ChatPromptTemplate.fromMessages.mockReturnValue(mockPrompt);

      const mockPassthrough = { _mockPassthrough: true };
      RunnablePassthrough.mockImplementation(() => mockPassthrough);

      const mockChain = { _mockChain: true };
      RunnableSequence.from.mockReturnValue(mockChain);

      const chain = getRAGChain();

      expect(createLLM).toHaveBeenCalledTimes(1);
      expect(ChatPromptTemplate.fromMessages).toHaveBeenCalledTimes(1);
      expect(RunnableSequence.from).toHaveBeenCalledTimes(1);
      expect(chain).toBe(mockChain);
    });

    it('should return the same instance on subsequent calls', () => {
      const mockLLM = { invoke: jest.fn() };
      createLLM.mockReturnValue(mockLLM);
      ChatPromptTemplate.fromMessages.mockReturnValue({});
      RunnablePassthrough.mockImplementation(() => ({}));
      RunnableSequence.from.mockReturnValue({});

      const chain1 = getRAGChain();
      const chain2 = getRAGChain();

      expect(chain1).toBe(chain2);
      expect(createLLM).toHaveBeenCalledTimes(1);
    });

    it('should create a new chain after clearRAGChain', () => {
      const mockLLM = { invoke: jest.fn() };
      createLLM.mockReturnValue(mockLLM);
      ChatPromptTemplate.fromMessages.mockReturnValue({});
      RunnablePassthrough.mockImplementation(() => ({}));
      let callCount = 0;
      RunnableSequence.from.mockImplementation(() => ({ id: callCount++ }));

      const chain1 = getRAGChain();
      clearRAGChain();
      const chain2 = getRAGChain();

      expect(chain1).not.toBe(chain2);
      expect(chain1.id).toBe(0);
      expect(chain2.id).toBe(1);
      expect(createLLM).toHaveBeenCalledTimes(2);
    });

    it('should build chain with correct structure (context, prompt, llm, parser)', () => {
      const mockLLM = { invoke: jest.fn() };
      createLLM.mockReturnValue(mockLLM);

      const mockPrompt = { _mockPrompt: true };
      ChatPromptTemplate.fromMessages.mockReturnValue(mockPrompt);

      const mockPassthrough = {};
      RunnablePassthrough.mockImplementation(() => mockPassthrough);

      const mockParser = { _mockParser: true };
      StringOutputParser.mockImplementation(() => mockParser);

      let capturedChain = null;
      RunnableSequence.from.mockImplementation((steps) => {
        capturedChain = steps;
        return { steps };
      });

      getRAGChain();

      expect(capturedChain).toHaveLength(4);
      expect(capturedChain[0]).toHaveProperty('input');
      expect(capturedChain[0]).toHaveProperty('context');
      expect(typeof capturedChain[0].context).toBe('function');
      expect(capturedChain[1]).toBe(mockPrompt);
      expect(capturedChain[2]).toBe(mockLLM);
      expect(capturedChain[3]).toBe(mockParser);
    });

    it('should inject context from vector store search in the chain context function', async () => {
      searchSimilarReports.mockResolvedValue([
        {
          metadata: { reportNumber: 'RPT-001', reportDate: '2024-01-15', equipmentName: 'Bomba' },
          pageContent: 'Motor temperature high',
        },
        {
          metadata: { reportNumber: 'RPT-002', reportDate: '2024-02-20', equipmentName: 'Motor' },
          pageContent: 'Bearing worn out',
        },
      ]);

      const mockLLM = { _mockLLM: true };
      createLLM.mockReturnValue(mockLLM);
      ChatPromptTemplate.fromMessages.mockReturnValue({});
      RunnablePassthrough.mockImplementation(() => ({}));

      let contextFn = null;
      RunnableSequence.from.mockImplementation((steps) => {
        contextFn = steps[0].context;
        return { invoke: jest.fn() };
      });

      getRAGChain();

      const context = await contextFn('overheating motor');

      expect(searchSimilarReports).toHaveBeenCalledWith('overheating motor', 5);
      expect(context).toContain('RPT-001');
      expect(context).toContain('RPT-002');
      expect(context).toContain('Bomba');
      expect(context).toContain('Motor temperature high');
    });

    it('should handle empty vector store results in context', async () => {
      searchSimilarReports.mockResolvedValue([]);

      const mockLLM = { _mockLLM: true };
      createLLM.mockReturnValue(mockLLM);
      ChatPromptTemplate.fromMessages.mockReturnValue({});
      RunnablePassthrough.mockImplementation(() => ({}));

      let contextFn = null;
      RunnableSequence.from.mockImplementation((steps) => {
        contextFn = steps[0].context;
        return { invoke: jest.fn() };
      });

      getRAGChain();

      const context = await contextFn('test');

      expect(context).toBe('');
    });
  });
});
