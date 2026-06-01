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

const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { askQuestion, chat, diagnose, reindexReports } = require('../ai');
const { streamChat, streamQuestion } = require('../ai/streaming');

describe('AI Routes Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      username: 'aitestuser',
      email: 'aitest@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    authToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
      },
      process.env.JWT_SECRET || 'test_secret_for_testing_only',
      { expiresIn: '1d' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ai/status', () => {
    it('should return AI status when authenticated', async () => {
      process.env.GROQ_API_KEY = 'test-gsk-key';
      process.env.HUGGINGFACEHUB_API_KEY = 'test-hf-key';

      const response = await request(app)
        .get('/api/ai/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groq_configured).toBe(true);
      expect(response.body.data.huggingface_configured).toBe(true);
      expect(response.body.data.llm_provider).toBe('Groq (llama3-70b-8192)');
      expect(response.body.data.langgraph_agents).toEqual(['assistantGraph', 'diagnosticGraph']);
    });
  });

  describe('POST /api/ai/ask', () => {
    it('should return answer for a valid question', async () => {
      askQuestion.mockResolvedValue('A pump is a mechanical device that moves fluids.');

      const response = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ question: 'What is a pump?' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.answer).toBe('A pump is a mechanical device that moves fluids.');
      expect(askQuestion).toHaveBeenCalledWith('What is a pump?');
    });

    it('should return 400 when question is missing', async () => {
      const response = await request(app)
        .post('/api/ai/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Se requiere una pregunta en el campo "question".');
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should return response for a valid message', async () => {
      chat.mockResolvedValue('Hello! I can help you with equipment information.');

      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe('Hello! I can help you with equipment information.');
      expect(chat).toHaveBeenCalledWith('Hello');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/diagnose', () => {
    it('should return diagnosis for valid symptoms', async () => {
      diagnose.mockResolvedValue({
        diagnosis: 'Bearing wear detected',
        recommendations: 'Replace bearings and lubricate',
        followUpQuestion: null,
      });

      const response = await request(app)
        .post('/api/ai/diagnose')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          equipment_id: 'eq-1',
          equipment_name: 'Centrifugal Pump',
          symptoms: 'Vibration and noise',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.diagnosis).toBe('Bearing wear detected');
      expect(response.body.data.recommendations).toBe('Replace bearings and lubricate');
      expect(diagnose).toHaveBeenCalledWith({
        equipmentId: 'eq-1',
        equipmentName: 'Centrifugal Pump',
        symptoms: 'Vibration and noise',
      });
    });

    it('should return 400 when symptoms is missing', async () => {
      const response = await request(app)
        .post('/api/ai/diagnose')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ equipment_name: 'Pump' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Se requiere la descripción de síntomas en el campo "symptoms".');
    });
  });

  describe('POST /api/ai/reindex', () => {
    it('should reindex reports and return success', async () => {
      reindexReports.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/ai/reindex')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reportes reindexados correctamente en el vector store.');
      expect(reindexReports).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/ai/stream-chat', () => {
    it('should stream chat tokens via SSE', async () => {
      streamChat.mockReturnValue(
        (async function* () {
          yield 'Hello';
          yield ' ';
          yield 'World';
        })()
      );

      const response = await request(app)
        .post('/api/ai/stream-chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hi' })
        .expect(200);

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.text).toContain('data: {"token":"Hello"}\n\n');
      expect(response.text).toContain('data: {"token":" "}\n\n');
      expect(response.text).toContain('data: {"token":"World"}\n\n');
      expect(response.text).toContain('data: {"done":true}\n\n');
      expect(streamChat).toHaveBeenCalledWith('Hi');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/ai/stream-chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Se requiere un mensaje en el campo "message".');
    });
  });

  describe('POST /api/ai/stream-ask', () => {
    it('should stream question answer tokens via SSE', async () => {
      streamQuestion.mockReturnValue(
        (async function* () {
          yield 'Una bomba';
        })()
      );

      const response = await request(app)
        .post('/api/ai/stream-ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ question: 'What is a pump?' })
        .expect(200);

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.text).toContain('data: {"token":"Una bomba"}\n\n');
      expect(response.text).toContain('data: {"done":true}\n\n');
      expect(streamQuestion).toHaveBeenCalledWith('What is a pump?');
    });

    it('should return 400 when question is missing', async () => {
      const response = await request(app)
        .post('/api/ai/stream-ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication required', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/ai/status')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
