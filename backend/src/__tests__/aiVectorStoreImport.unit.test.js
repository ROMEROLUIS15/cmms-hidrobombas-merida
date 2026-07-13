/**
 * Test deliberadamente SIN mocks.
 *
 * El resto de tests del vector store mockean el módulo de LangChain, y eso
 * ocultó un bug real: el import apuntaba a `@langchain/core/vectorstores`, que
 * NO exporta `MemoryVectorStore` (solo la clase base). El mock fabricaba la
 * clase que faltaba, así que la suite pasaba en verde mientras producción
 * reventaba con "MemoryVectorStore is not a constructor" al usar el RAG.
 *
 * Este test carga el módulo DE VERDAD. Si una futura versión de LangChain vuelve
 * a mover la clase, falla el CI en lugar de fallar en producción.
 */
const { MemoryVectorStore } = require('@langchain/classic/vectorstores/memory');

describe('MemoryVectorStore: import real (sin mocks)', () => {
  it('la ruta del import expone un constructor usable', () => {
    expect(typeof MemoryVectorStore).toBe('function');

    const fakeEmbeddings = {
      embedDocuments: async (texts) => texts.map(() => [0, 0, 0]),
      embedQuery: async () => [0, 0, 0],
    };

    const store = new MemoryVectorStore(fakeEmbeddings);

    expect(typeof store.addDocuments).toBe('function');
    expect(typeof store.similaritySearch).toBe('function');
  });
});
