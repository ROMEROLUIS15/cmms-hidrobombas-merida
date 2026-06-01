jest.mock('../ai/config', () => ({
  createLLM: jest.fn(),
}));

const { createLLM } = require('../ai/config');
const { streamChat, streamQuestion } = require('../ai/streaming');

async function collect(generator) {
  const results = [];
  for await (const value of generator()) {
    results.push(value);
  }
  return results;
}

describe('AI Streaming Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('streamChat', () => {
    it('should yield tokens from the LLM stream', async () => {
      const mockLLM = {
        stream: jest.fn().mockResolvedValue(
          (async function* () {
            yield { content: 'Hola' };
            yield { content: ' ' };
            yield { content: 'mundo' };
          })()
        ),
      };
      createLLM.mockReturnValue(mockLLM);

      const tokens = await collect(() => streamChat('test message'));

      expect(createLLM).toHaveBeenCalledTimes(1);
      expect(mockLLM.stream).toHaveBeenCalledWith([
        { role: 'user', content: 'test message' },
      ]);
      expect(tokens).toEqual(['Hola', ' ', 'mundo']);
    });

    it('should skip chunks without content', async () => {
      const mockLLM = {
        stream: jest.fn().mockResolvedValue(
          (async function* () {
            yield { content: '' };
            yield { other: 'data' };
            yield { content: 'real' };
          })()
        ),
      };
      createLLM.mockReturnValue(mockLLM);

      const tokens = await collect(() => streamChat('msg'));

      expect(tokens).toEqual(['real']);
    });
  });

  describe('streamQuestion', () => {
    it('should yield tokens with system prompt', async () => {
      const mockLLM = {
        stream: jest.fn().mockResolvedValue(
          (async function* () {
            yield { content: 'Answer' };
          })()
        ),
      };
      createLLM.mockReturnValue(mockLLM);

      const tokens = await collect(() => streamQuestion('test question'));

      expect(createLLM).toHaveBeenCalledTimes(1);
      expect(mockLLM.stream).toHaveBeenCalledWith([
        { role: 'system', content: expect.stringContaining('Hidrobombas Mérida') },
        { role: 'user', content: 'test question' },
      ]);
      expect(tokens).toEqual(['Answer']);
    });
  });
});
