/**
 * useOfflineQueue
 * Saves pending service reports to IndexedDB when offline.
 * Queued reports are replayed by the Service Worker's Background Sync.
 */

const DB_NAME    = 'hidrobombas-offline';
const DB_VERSION = 1;
const STORE      = 'pendingReports';

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

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
 * @param {Object} reportData  — the form data to submit
 * @param {string} token       — the JWT token to replay with
 * @returns {number} queued item ID
 */
export const enqueueReport = async (reportData, token) => {
  const id = await dbAdd({
    data:      reportData,
    token,
    queuedAt:  new Date().toISOString(),
  });

  // Register background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const sw = await navigator.serviceWorker.ready;
    await sw.sync.register('sync-reports').catch(console.warn);
  }

  return id;
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
