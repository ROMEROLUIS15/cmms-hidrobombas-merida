/** @typedef {import('@langchain/core/vectorstores').VectorStore} VectorStore */
/** @typedef {import('@langchain/core/embeddings').Embeddings} Embeddings */
/** @typedef {import('@langchain/core/documents').Document} Document */

const { MemoryVectorStore } = require('@langchain/core/vectorstores');
const { container } = require('./container');
const { ServiceReport, Equipment } = require('../models');

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

const providers = {
  memory: memoryProvider,
};

const providerEnv = (process.env.VECTOR_STORE_PROVIDER || 'memory').toLowerCase();

/** @type {VectorStoreProvider} */
let activeProvider = providers[providerEnv];

if (!activeProvider) {
  console.warn(
    `VECTOR_STORE_PROVIDER "${providerEnv}" no es válido. Usando "memory". ` +
    'Valores soportados: memory'
  );
  activeProvider = providers.memory;
}

module.exports = {
  getOrCreateVectorStore: () => activeProvider.getOrCreateStore(),
  searchSimilarReports: (query, k) => activeProvider.searchSimilar(query, k),
  clearVectorStore: () => activeProvider.clear(),
  providers,
  formatReportForEmbedding,
  loadReports,
};
