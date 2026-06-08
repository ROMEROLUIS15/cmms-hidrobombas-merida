jest.mock('../ai', () => ({
  askQuestion: jest.fn(),
  chat: jest.fn(),
  diagnose: jest.fn(),
  reindexReports: jest.fn(),
}));

jest.mock('../ai/streaming', () => ({
  streamChat: jest.fn(),
  streamQuestion: jest.fn(),
}));

const { askQuestion, chat, diagnose, reindexReports } = require('../ai');
const { streamChat, streamQuestion } = require('../ai/streaming');
const {
  aiAsk,
  aiChat,
  aiDiagnose,
  aiReindex,
  aiStatus,
  aiStreamChat,
  aiStreamAsk,
} = require('../controllers/aiController');

describe('AI Controller Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      writeHead: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('aiAsk', () => {
    it('should return 400 if question is missing', async () => {
      req.body = {};

      await aiAsk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere una pregunta en el campo "question".',
      });
      expect(askQuestion).not.toHaveBeenCalled();
    });

    it('should return 400 if question is not a string', async () => {
      req.body = { question: 123 };

      await aiAsk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere una pregunta en el campo "question".',
      });
    });

    it('should return 200 with answer on success', async () => {
      req.body = { question: 'What is a pump?' };
      askQuestion.mockResolvedValue('A pump is a mechanical device.');

      await aiAsk(req, res);

      expect(askQuestion).toHaveBeenCalledWith('What is a pump?');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { answer: 'A pump is a mechanical device.' },
      });
    });

    it('should accept whitespace-only string since validation only checks type', async () => {
      req.body = { question: '   ' };
      askQuestion.mockResolvedValue('Answer for whitespace');

      await aiAsk(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('aiChat', () => {
    it('should return 400 if message is missing', async () => {
      req.body = {};

      await aiChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere un mensaje en el campo "message".',
      });
      expect(chat).not.toHaveBeenCalled();
    });

    it('should return 200 with response on success', async () => {
      req.body = { message: 'Hello' };
      chat.mockResolvedValue('Hi there!');

      await aiChat(req, res);

      expect(chat).toHaveBeenCalledWith('Hello');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { response: 'Hi there!' },
      });
    });
  });

  describe('aiDiagnose', () => {
    it('should return 400 if symptoms is missing', async () => {
      req.body = { equipment_name: 'Pump' };

      await aiDiagnose(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere la descripción de síntomas en el campo "symptoms".',
      });
      expect(diagnose).not.toHaveBeenCalled();
    });

    it('should return 200 with diagnosis on success (with equipment fields)', async () => {
      req.body = {
        equipment_id: 'eq-1',
        equipment_name: 'Centrifugal Pump',
        symptoms: 'Vibration',
      };
      diagnose.mockResolvedValue({
        diagnosis: 'Bearing issue',
        recommendations: 'Replace bearing',
        followUpQuestion: null,
      });

      await aiDiagnose(req, res);

      expect(diagnose).toHaveBeenCalledWith({
        equipmentId: 'eq-1',
        equipmentName: 'Centrifugal Pump',
        symptoms: 'Vibration',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          diagnosis: 'Bearing issue',
          recommendations: 'Replace bearing',
          followUpQuestion: null,
        },
      });
    });

    it('should pass null for missing optional equipment fields', async () => {
      req.body = { symptoms: 'Overheating' };
      diagnose.mockResolvedValue({
        diagnosis: 'Cooling system failure',
        recommendations: 'Check coolant',
        followUpQuestion: null,
      });

      await aiDiagnose(req, res);

      expect(diagnose).toHaveBeenCalledWith({
        equipmentId: null,
        equipmentName: null,
        symptoms: 'Overheating',
      });
    });
  });

  describe('aiReindex', () => {
    it('should call reindexReports and return success', async () => {
      reindexReports.mockResolvedValue(undefined);

      await aiReindex(req, res);

      expect(reindexReports).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Reportes reindexados correctamente en el vector store.',
      });
    });

    it('should propagate errors from reindexReports', async () => {
      reindexReports.mockRejectedValue(new Error('Reindex failed'));

      await expect(aiReindex(req, res)).rejects.toThrow('Reindex failed');
    });
  });

  describe('aiStreamChat', () => {
    it('should return 400 if message is missing', async () => {
      req.body = {};

      await aiStreamChat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere un mensaje en el campo "message".',
      });
      expect(streamChat).not.toHaveBeenCalled();
    });

    it('should stream tokens via SSE', async () => {
      req.body = { message: 'Hello' };
      streamChat.mockReturnValue(
        (async function* () {
          yield 'Hola';
          yield ' ';
          yield 'mundo';
        })()
      );

      await aiStreamChat(req, res);

      expect(streamChat).toHaveBeenCalledWith('Hello');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.write).toHaveBeenCalledWith('data: {"token":"Hola"}\n\n');
      expect(res.write).toHaveBeenCalledWith('data: {"token":" "}\n\n');
      expect(res.write).toHaveBeenCalledWith('data: {"token":"mundo"}\n\n');
      expect(res.write).toHaveBeenCalledWith('data: {"done":true}\n\n');
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('should send error event on stream failure', async () => {
      req.body = { message: 'Hi' };
      streamChat.mockReturnValue(
        (async function* () {
          throw new Error('Stream error');
        })()
      );

      await aiStreamChat(req, res);

      expect(res.write).toHaveBeenCalledWith(
        'data: {"error":"Error durante la generación de la respuesta."}\n\n'
      );
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('aiStreamAsk', () => {
    it('should return 400 if question is missing', async () => {
      req.body = {};

      await aiStreamAsk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Se requiere una pregunta en el campo "question".',
      });
      expect(streamQuestion).not.toHaveBeenCalled();
    });

    it('should stream tokens via SSE', async () => {
      req.body = { question: 'What is a pump?' };
      streamQuestion.mockReturnValue(
        (async function* () {
          yield 'Una ';
          yield 'bomba';
        })()
      );

      await aiStreamAsk(req, res);

      expect(streamQuestion).toHaveBeenCalledWith('What is a pump?');
      expect(res.write).toHaveBeenCalledWith('data: {"token":"Una "}\n\n');
      expect(res.write).toHaveBeenCalledWith('data: {"token":"bomba"}\n\n');
      expect(res.write).toHaveBeenCalledWith('data: {"done":true}\n\n');
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('aiStatus', () => {
    // FIX: Capture and restore env vars to prevent cross-suite contamination.
    // Previously, GROQ_API_KEY and HUGGINGFACEHUB_API_KEY were set but never
    // restored, polluting process.env for all subsequent test suites.
    let originalGroqKey;
    let originalHfKey;

    beforeEach(() => {
      originalGroqKey = process.env.GROQ_API_KEY;
      originalHfKey = process.env.HUGGINGFACEHUB_API_KEY;
    });

    afterEach(() => {
      if (originalGroqKey === undefined) {
        delete process.env.GROQ_API_KEY;
      } else {
        process.env.GROQ_API_KEY = originalGroqKey;
      }
      if (originalHfKey === undefined) {
        delete process.env.HUGGINGFACEHUB_API_KEY;
      } else {
        process.env.HUGGINGFACEHUB_API_KEY = originalHfKey;
      }
    });

    it('should return status with all providers configured when API keys are present', async () => {
      // Arrange
      process.env.GROQ_API_KEY = 'gsk_key';
      process.env.HUGGINGFACEHUB_API_KEY = 'hf_key';

      // Act
      await aiStatus(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          groq_configured: true,
          huggingface_configured: true,
          llm_provider: 'Groq (llama3-70b-8192)',
          embeddings_provider: 'HuggingFace (all-MiniLM-L6-v2)',
          vector_store: 'MemoryVectorStore (en memoria)',
          langgraph_agents: ['assistantGraph', 'diagnosticGraph'],
        },
      });
    });

    it('should reflect unconfigured providers when API keys are absent', async () => {
      // Arrange
      delete process.env.GROQ_API_KEY;
      delete process.env.HUGGINGFACEHUB_API_KEY;

      // Act
      await aiStatus(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            groq_configured: false,
            huggingface_configured: false,
          }),
        })
      );
    });
  });
});
