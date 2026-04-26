/* ─────────────────────────────────────────────────────────────────────────────
   Service Worker — CMMS Hidrobombas Mérida
   Estrategia:
     • Assets estáticos  → Cache First  (precached on install)
     • Llamadas a la API → Network First con fallback a cache (sin login)
     • Navegación HTML   → Network First con fallback offline
   ───────────────────────────────────────────────────────────────────────────── */

const CACHE_VERSION   = 'v1.0.0';
const STATIC_CACHE    = `hidrobombas-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE   = `hidrobombas-dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE    = '/offline.html';

// Assets to precache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and posthog requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.includes('posthog')) return;

  // API calls → Network First
  if (url.pathname.startsWith('/api') || url.port === '8001') {
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML navigation → Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_PAGE) || caches.match('/index.html')
      )
    );
    return;
  }

  // Static assets → Cache First
  event.respondWith(cacheFirst(request));
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso no disponible offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, message: 'Sin conexión a internet', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Background Sync — Offline Queue ──────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncOfflineReports());
  }
});

async function syncOfflineReports() {
  // Open offline queue from IndexedDB and replay pending requests
  try {
    const db = await openDB();
    const tx = db.transaction('pendingReports', 'readwrite');
    const store = tx.objectStore('pendingReports');
    const all = await storeGetAll(store);

    for (const item of all) {
      try {
        const res = await fetch('/api/service-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${item.token}`
          },
          body: JSON.stringify(item.data)
        });
        if (res.ok) {
          await store.delete(item.id);
          console.log('[SW] Synced offline report:', item.id);
          // Notify all clients
          const clients = await self.clients.matchAll();
          clients.forEach(c => c.postMessage({ type: 'REPORT_SYNCED', id: item.id }));
        }
      } catch (err) {
        console.warn('[SW] Failed to sync report:', item.id, err);
      }
    }
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
  }
}

// ── IndexedDB helpers (used inside SW) ───────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hidrobombas-offline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingReports')) {
        db.createObjectStore('pendingReports', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function storeGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}
