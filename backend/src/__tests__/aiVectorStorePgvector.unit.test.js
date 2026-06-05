jest.mock('../ai/config', () => ({
  createEmbeddings: jest.fn(() => ({ _mockEmbeddings: true })),
}));
jest.mock('../models', () => ({
  ServiceReport: { findAll: jest.fn().mockResolvedValue([]) },
  Equipment: {},
}));

const { providers } = require('../ai/vectorStoreProvider');

describe('pgvector vector store provider', () => {
  const original = process.env.DATABASE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    providers.pgvector._store = null;
  });

  it('está registrado con la interfaz de provider', () => {
    expect(providers.pgvector).toBeDefined();
    expect(typeof providers.pgvector.getOrCreateStore).toBe('function');
    expect(typeof providers.pgvector.searchSimilar).toBe('function');
    expect(typeof providers.pgvector.clear).toBe('function');
  });

  it('lanza un error claro si falta DATABASE_URL', async () => {
    delete process.env.DATABASE_URL;
    providers.pgvector._store = null;
    await expect(providers.pgvector.getOrCreateStore()).rejects.toThrow(/DATABASE_URL/);
  });

  it('searchSimilar también exige DATABASE_URL', async () => {
    delete process.env.DATABASE_URL;
    providers.pgvector._store = null;
    await expect(providers.pgvector.searchSimilar('algo', 3)).rejects.toThrow(/DATABASE_URL/);
  });

  it('clear() es seguro cuando no está inicializado', async () => {
    providers.pgvector._store = null;
    await expect(providers.pgvector.clear()).resolves.toBeUndefined();
  });
});
