const { container, setCreateLLM, setCreateEmbeddings, resetToDefaults } = require('../ai/container');

describe('AI Container Unit Tests', () => {
  afterEach(() => {
    resetToDefaults();
  });

  it('should have default createLLM and createEmbeddings', () => {
    expect(typeof container.createLLM).toBe('function');
    expect(typeof container.createEmbeddings).toBe('function');
  });

  it('should allow overriding createLLM via setCreateLLM', () => {
    const mockLLM = { invoke: jest.fn() };
    const factory = jest.fn(() => mockLLM);

    setCreateLLM(factory);

    const result = container.createLLM();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockLLM);
  });

  it('should allow overriding createEmbeddings via setCreateEmbeddings', () => {
    const mockEmbeddings = { embedQuery: jest.fn() };
    const factory = jest.fn(() => mockEmbeddings);

    setCreateEmbeddings(factory);

    const result = container.createEmbeddings();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockEmbeddings);
  });

  it('should restore defaults after resetToDefaults', () => {
    setCreateLLM(() => ({ invoke: jest.fn() }));
    setCreateEmbeddings(() => ({ embedQuery: jest.fn() }));

    resetToDefaults();

    expect(container.createLLM.toString()).toContain('ChatGroq');
    expect(container.createEmbeddings.toString()).toContain('HuggingFaceInferenceEmbeddings');
  });
});
