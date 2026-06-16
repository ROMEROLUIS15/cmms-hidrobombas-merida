const { ChatGroq } = require('@langchain/groq');
const { HuggingFaceInferenceEmbeddings } = require('@langchain/community/embeddings/hf');

jest.mock('@langchain/groq');
jest.mock('@langchain/community/embeddings/hf');

const { createLLM, createEmbeddings } = require('../ai/config');

describe('AI Config Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLLM', () => {
    it('should create a ChatGroq instance with default config', () => {
      delete process.env.GROQ_MODEL;
      ChatGroq.mockImplementation((config) => ({ ...config, _isMock: true }));

      const llm = createLLM();

      expect(ChatGroq).toHaveBeenCalledTimes(1);
      expect(ChatGroq).toHaveBeenCalledWith({
        model: 'llama3-70b-8192',
        temperature: 0.1,
        apiKey: process.env.GROQ_API_KEY,
      });
      expect(llm._isMock).toBe(true);
    });

    it('should pass the GROQ_API_KEY from environment', () => {
      const testKey = 'gsk_test_key_12345';
      process.env.GROQ_API_KEY = testKey;
      ChatGroq.mockImplementation((config) => config);

      const llm = createLLM();

      expect(llm.apiKey).toBe(testKey);
    });

    it('should override the model when GROQ_MODEL is set', () => {
      const original = process.env.GROQ_MODEL;
      process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';
      ChatGroq.mockImplementation((config) => config);

      const llm = createLLM();

      expect(llm.model).toBe('llama-3.3-70b-versatile');

      if (original === undefined) delete process.env.GROQ_MODEL;
      else process.env.GROQ_MODEL = original;
    });
  });

  describe('createEmbeddings', () => {
    it('should create a HuggingFaceInferenceEmbeddings instance with default config', () => {
      HuggingFaceInferenceEmbeddings.mockImplementation((config) => ({ ...config, _isMock: true }));

      const embeddings = createEmbeddings();

      expect(HuggingFaceInferenceEmbeddings).toHaveBeenCalledTimes(1);
      expect(HuggingFaceInferenceEmbeddings).toHaveBeenCalledWith({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        apiKey: process.env.HUGGINGFACEHUB_API_KEY,
      });
      expect(embeddings._isMock).toBe(true);
    });

    it('should pass the HUGGINGFACEHUB_API_KEY from environment', () => {
      const testKey = 'hf_test_key_12345';
      process.env.HUGGINGFACEHUB_API_KEY = testKey;
      HuggingFaceInferenceEmbeddings.mockImplementation((config) => config);

      const embeddings = createEmbeddings();

      expect(embeddings.apiKey).toBe(testKey);
    });
  });
});
