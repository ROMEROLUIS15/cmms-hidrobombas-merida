import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Node.js + TypeScript backend working',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CMMS Backend - Node.js + TypeScript',
    version: '1.0.0',
  });
});

app.listen(8001, '0.0.0.0', () => {
  console.log('🚀 Basic server running on port 8001');
});