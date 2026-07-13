/**
 * useOfflineQueue
 * Saves pending service reports to IndexedDB when offline.
 * Queued reports are replayed by the Service Worker's Background Sync.
 */

const DB_NAME    = 'hidrobombas-offline';
const DB_VERSION = 1;
const STORE      = 'pendingReports';

/** Generates a simple UUID v4 without external dependencies */
const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

/**
 * Abre la conexión con IndexedDB.
 * @returns {Promise<IDBDatabase>} La instancia de la base de datos.
 */
const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });

const dbAdd = async (record) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

const dbGetAll = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

const dbDelete = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enqueue a report for later sync.
 * Idempotent: if a report with the same clientRequestId is already queued,
 * it will NOT be added again (prevents duplicates on double-tap / retry).
 *
 * @param {Object} reportData  — the form data to submit
 * @param {string} token       — the JWT token to replay with
 * @param {string} [url]       — endpoint completo de destino. Se guarda porque
 *   el backend puede estar en otro origen que la PWA; el Service Worker debe
 *   reenviar a esta URL, no a una ruta relativa a su propio origen.
 * @returns {{ id: number, clientRequestId: string }} queued item metadata
 */
export const enqueueReport = async (
  reportData,
  token,
  // El default apunta al BACKEND, no al origen de la PWA. Con una ruta relativa,
  // el reenvío iría contra el hosting estático del frontend y devolvería 405
  // (es justo lo que le pasaba al asistente de IA). Hoy ServiceWizard pasa la
  // URL absoluta, pero un default relativo es una trampa para el próximo llamador.
  url = `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/service-reports`
) => {
  // Generate a stable idempotency key for this specific report attempt
  const clientRequestId = reportData._clientRequestId || uuidv4();
  const reportWithId = { ...reportData, _clientRequestId: clientRequestId };

  // Deduplication: check if a report with the same clientRequestId already exists
  const existing = await dbGetAll();
  const duplicate = existing.find((item) => item.clientRequestId === clientRequestId);
  if (duplicate) {
    return { id: duplicate.id, clientRequestId };
  }

  const id = await dbAdd({
    data:            reportWithId,
    token,
    url,
    clientRequestId,
    queuedAt:        new Date().toISOString(),
  });

  // Register background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const sw = await navigator.serviceWorker.ready;
    await sw.sync.register('sync-reports').catch(() => {});
  }

  return { id, clientRequestId };
};

/**
 * Returns all pending reports in the offline queue.
 */
export const getPendingReports = () => dbGetAll();

/**
 * Removes a specific pending report from the queue.
 */
export const removePendingReport = (id) => dbDelete(id);

/**
 * Replay manual de la cola (fallback cuando NO hay Background Sync, p. ej.
 * Safari/iOS). Reenvía cada reporte por fetch a su `url` guardada, incluyendo
 * `X-Idempotency-Key` para que el backend deduplique reintentos, y elimina de
 * la cola solo los que se envían con éxito.
 * @returns {{ synced: number, failed: number }}
 */
export const syncPendingReports = async () => {
  const pending = await dbGetAll();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const res = await fetch(item.url || '/api/service-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${item.token}`,
          'X-Idempotency-Key': item.clientRequestId,
        },
        body: JSON.stringify(item.data),
      });
      if (res.ok) {
        await dbDelete(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
};

/**
 * Manually replay all queued reports (when online).
 * Used as a fallback if Background Sync is not supported.
 * @param {Function} submitFn  — async fn that sends one report: (data, token) => void
 * @returns {{ synced: number, failed: number }}
 */
export const replayQueue = async (submitFn) => {
  const pending = await dbGetAll();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await submitFn(item.data, item.token);
      await dbDelete(item.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
};
