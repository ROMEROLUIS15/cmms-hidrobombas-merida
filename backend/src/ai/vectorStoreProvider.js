/** @typedef {import('@langchain/core/vectorstores').VectorStore} VectorStore */
/** @typedef {import('@langchain/core/embeddings').Embeddings} Embeddings */
/** @typedef {import('@langchain/core/documents').Document} Document */

// OJO con la ruta: `@langchain/core/vectorstores` solo exporta la clase BASE
// (VectorStore). En LangChain v1 la implementación en memoria se movió a
// `@langchain/classic`. Importarla del sitio equivocado no falla al cargar el
// módulo: revienta en runtime con "MemoryVectorStore is not a constructor" la
// primera vez que alguien usa el RAG. Pasó en producción (2026-07-13).
const { MemoryVectorStore } = require('@langchain/classic/vectorstores/memory');
const { container } = require('./container');
const { ServiceReport, Equipment } = require('../models');
const { logger } = require('../utils/logger');

/**
 * @param {ServiceReportRow} report
 * @returns {string}
 */
function formatReportForEmbedding(report) {
  const lines = [
    `Reporte ${report.reportNumber || 'N/A'} - ${report.reportDate || ''}`,
    `Equipo: ${report.equipment?.name || 'N/A'} (${report.equipment?.type || 'N/A'})`,
    `Técnico: ${report.technicianName || 'N/A'}`,
    `Tipo de visita: ${report.visitType || 'N/A'}`,
    `Sistema: ${report.systemName || 'N/A'}`,
    `Descripción: ${report.description || ''}`,
    `Observaciones: ${report.observations || ''}`,
    `Recomendaciones: ${report.recommendations || ''}`,
    `Partes usadas: ${report.partsUsed || ''}`,
    `Datos de agua/energía: ${JSON.stringify(report.waterEnergyData || {})}`,
    `Datos de motores: ${JSON.stringify(report.motorsData || [])}`,
    `Datos de control: ${JSON.stringify(report.controlData || {})}`,
  ];
  return lines.join('\n');
}

/**
 * @returns {Promise<Document[]>}
 */
async function loadReports() {
  const reports = await ServiceReport.findAll({
    include: [
      {
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'type', 'brand', 'serialNumber'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return reports.map((r) => ({
    pageContent: formatReportForEmbedding(r),
    metadata: {
      id: r.id,
      reportNumber: r.reportNumber,
      reportDate: r.reportDate,
      equipmentId: r.equipment?.id,
      equipmentName: r.equipment?.name,
      equipmentType: r.equipment?.type,
      visitType: r.visitType,
      technicianName: r.technicianName,
    },
  }));
}

/**
 * Abstract vector store provider interface.
 * @typedef {Object} VectorStoreProvider
 * @property {() => Promise<VectorStore>} getOrCreateStore
 * @property {(query: string, k: number) => Promise<Document[]>} searchSimilar
 * @property {() => void} clear
 */

/** @type {VectorStoreProvider} */
const memoryProvider = {
  /** @type {VectorStore|null} */
  _store: null,

  async getOrCreateStore() {
    if (this._store) return this._store;

    const embeddings = container.createEmbeddings();
    this._store = new MemoryVectorStore(embeddings);

    const docs = await loadReports();
    if (docs.length > 0) {
      await this._store.addDocuments(docs);
    }

    return this._store;
  },

  async searchSimilar(query, k = 5) {
    const store = await this.getOrCreateStore();
    return store.similaritySearch(query, k);
  },

  clear() {
    this._store = null;
  },
};

const PGVECTOR_TABLE = process.env.PGVECTOR_TABLE || 'ai_report_embeddings';

/**
 * Provider persistente sobre PostgreSQL + extensión pgvector.
 * Reutiliza @langchain/community (ya dependencia) y la misma BD del proyecto.
 * Solo aplicable con DATABASE_URL (Postgres); en SQLite/dev usar "memory".
 * @type {VectorStoreProvider}
 */
const pgvectorProvider = {
  /** @type {VectorStore|null} */
  _store: null,

  async _init() {
    if (this._store) return this._store;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'VECTOR_STORE_PROVIDER=pgvector requiere DATABASE_URL (PostgreSQL). ' +
        'Usa "memory" en desarrollo con SQLite.'
      );
    }

    let PGVectorStore;
    try {
      ({ PGVectorStore } = require('@langchain/community/vectorstores/pgvector'));
    } catch (err) {
      throw new Error(`No se pudo cargar PGVectorStore de @langchain/community: ${err.message}`, { cause: err });
    }

    const embeddings = container.createEmbeddings();
    this._store = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: {
        connectionString: databaseUrl,
        // Verificamos la cadena TLS, igual que `config/database.js` (que se
        // endureció justo por esto). Con `false` se acepta cualquier
        // certificado y la conexión a la BD queda expuesta a un MITM — y este
        // proveedor habla con la MISMA base que Sequelize protege. Neon emite
        // certificados de una CA pública, así que la verificación pasa.
        ssl: { rejectUnauthorized: true },
      },
      tableName: PGVECTOR_TABLE,
      distanceStrategy: 'cosine',
    });

    return this._store;
  },

  async getOrCreateStore() {
    const store = await this._init();

    // Persistente: poblar SOLO si la tabla está vacía (evita duplicar embeddings
    // en cada arranque). El reindexado fuerza el repoblado vía clear().
    let count = 0;
    try {
      const res = await store.pool.query(`SELECT COUNT(*)::int AS n FROM "${store.computedTableName}"`);
      count = res.rows[0].n;
    } catch {
      // Conteo no disponible (tabla recién creada / permisos): tratar como vacía.
    }

    if (count === 0) {
      const docs = await loadReports();
      if (docs.length > 0) await store.addDocuments(docs);
    }

    return store;
  },

  async searchSimilar(query, k = 5) {
    const store = await this._init();
    return store.similaritySearch(query, k);
  },

  async clear() {
    if (this._store) {
      try {
        await this._store.pool.query(`DELETE FROM "${this._store.computedTableName}"`);
      } catch {
        // Tabla aún inexistente o sin permisos: ignorar.
      }
    }
    this._store = null;
  },
};

const providers = {
  memory: memoryProvider,
  pgvector: pgvectorProvider,
};

const providerEnv = (process.env.VECTOR_STORE_PROVIDER || 'memory').toLowerCase();

/** @type {VectorStoreProvider} */
let activeProvider = providers[providerEnv];
let activeProviderName = providerEnv;

if (!activeProvider) {
  logger.warn('VECTOR_STORE_PROVIDER inválido; usando "memory"', {
    provided: providerEnv,
    supported: ['memory', 'pgvector'],
  });
  activeProvider = providers.memory;
  activeProviderName = 'memory';
}

const PROVIDER_LABELS = {
  memory: 'MemoryVectorStore (en memoria)',
  pgvector: `PGVectorStore (PostgreSQL/pgvector, tabla "${PGVECTOR_TABLE}")`,
};

module.exports = {
  getOrCreateVectorStore: () => activeProvider.getOrCreateStore(),
  searchSimilarReports: (query, k) => activeProvider.searchSimilar(query, k),
  clearVectorStore: () => activeProvider.clear(),
  providers,
  formatReportForEmbedding,
  loadReports,
  activeProviderName,
  activeProviderLabel: PROVIDER_LABELS[activeProviderName] || activeProviderName,
};
