/**
 * useOfflineQueue — Tests de Idempotencia y Comportamiento
 *
 * Estrategia: usamos fake-indexeddb para ejercitar la lógica REAL del hook
 * (en lugar de mockear el módulo completo). Esto valida que:
 *   - No se encolan duplicados con el mismo clientRequestId
 *   - replayQueue elimina entradas de la cola al sincronizar con éxito
 *   - replayQueue no elimina entradas si el submit falla
 *   - getPendingReports y removePendingReport funcionan correctamente
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Silencia el aviso de Background Sync no disponible en test ─────────────
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = vi.fn();
});
afterEach(() => {
  console.warn = originalWarn;
});

// ── Resetear IndexedDB entre tests para aislamiento completo ──────────────
// fake-indexeddb no limpia automáticamente entre tests, lo hacemos manualmente
let freshIndexedDB;
beforeEach(() => {
  freshIndexedDB = new IDBFactory();
  // Patch the global so the hook picks up a clean DB
  global.indexedDB = freshIndexedDB;
  // Ensure serviceWorker is undefined so sync registration is skipped
  delete global.navigator.serviceWorker;
});

// Importar DESPUÉS del patch de indexedDB
const { enqueueReport, getPendingReports, removePendingReport, replayQueue } =
  await import('../../hooks/useOfflineQueue');

// ─────────────────────────────────────────────────────────────────────────────

describe('enqueueReport', () => {
  it('encola un reporte y devuelve id + clientRequestId', async () => {
    const result = await enqueueReport({ client_id: 'c1', equipment_id: 'e1' }, 'jwt-token');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('clientRequestId');
    expect(typeof result.clientRequestId).toBe('string');
    expect(result.clientRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('✅ IDEMPOTENCIA — no duplica si se llama dos veces con el mismo clientRequestId', async () => {
    const reportData = { client_id: 'c1', equipment_id: 'e1', _clientRequestId: 'fixed-id-001' };

    const first  = await enqueueReport(reportData, 'token-a');
    const second = await enqueueReport(reportData, 'token-a');

    // Ambas llamadas deben devolver el mismo id de IndexedDB
    expect(first.id).toBe(second.id);
    expect(first.clientRequestId).toBe(second.clientRequestId);

    // Solo debe haber 1 entrada en la cola
    const pending = await getPendingReports();
    expect(pending).toHaveLength(1);
  });

  it('encola reportes distintos (distintos clientRequestId) como entradas separadas', async () => {
    await enqueueReport({ client_id: 'c1', _clientRequestId: 'id-A' }, 'token');
    await enqueueReport({ client_id: 'c2', _clientRequestId: 'id-B' }, 'token');

    const pending = await getPendingReports();
    expect(pending).toHaveLength(2);
  });

  it('persiste el token junto al reporte en la cola', async () => {
    await enqueueReport({ client_id: 'c1' }, 'mi-jwt-secreto');

    const pending = await getPendingReports();
    expect(pending[0].token).toBe('mi-jwt-secreto');
  });

  it('adjunta el clientRequestId dentro del payload (data._clientRequestId)', async () => {
    await enqueueReport({ client_id: 'c1', _clientRequestId: 'id-embed' }, 'token');

    const pending = await getPendingReports();
    expect(pending[0].data._clientRequestId).toBe('id-embed');
    expect(pending[0].clientRequestId).toBe('id-embed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getPendingReports', () => {
  it('devuelve array vacío cuando la cola está limpia', async () => {
    const pending = await getPendingReports();
    expect(pending).toBeInstanceOf(Array);
    expect(pending).toHaveLength(0);
  });

  it('devuelve todos los reportes encolados', async () => {
    await enqueueReport({ client_id: 'c1', _clientRequestId: 'r1' }, 'tok');
    await enqueueReport({ client_id: 'c2', _clientRequestId: 'r2' }, 'tok');

    const pending = await getPendingReports();
    expect(pending).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('removePendingReport', () => {
  it('elimina una entrada específica de la cola por su id de IndexedDB', async () => {
    const { id } = await enqueueReport({ client_id: 'c1', _clientRequestId: 'del-1' }, 'tok');
    await enqueueReport({ client_id: 'c2', _clientRequestId: 'del-2' }, 'tok');

    await removePendingReport(id);

    const pending = await getPendingReports();
    expect(pending).toHaveLength(1);
    expect(pending[0].clientRequestId).toBe('del-2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('replayQueue', () => {
  it('llama a submitFn con los datos y token de cada reporte en cola', async () => {
    await enqueueReport({ client_id: 'c1', _clientRequestId: 'rq-1' }, 'token-1');
    await enqueueReport({ client_id: 'c2', _clientRequestId: 'rq-2' }, 'token-2');

    const submitFn = vi.fn().mockResolvedValue(undefined);
    await replayQueue(submitFn);

    expect(submitFn).toHaveBeenCalledTimes(2);
    expect(submitFn).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'c1' }),
      'token-1'
    );
    expect(submitFn).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'c2' }),
      'token-2'
    );
  });

  it('elimina el reporte de la cola cuando submitFn tiene éxito', async () => {
    await enqueueReport({ client_id: 'c1', _clientRequestId: 'rq-ok' }, 'tok');

    const submitFn = vi.fn().mockResolvedValue(undefined);
    const { synced, failed } = await replayQueue(submitFn);

    expect(synced).toBe(1);
    expect(failed).toBe(0);

    // La cola debe estar vacía tras el sync exitoso
    const pending = await getPendingReports();
    expect(pending).toHaveLength(0);
  });

  it('✅ NO elimina el reporte de la cola si submitFn falla (reintento seguro)', async () => {
    await enqueueReport({ client_id: 'c1', _clientRequestId: 'rq-fail' }, 'tok');

    const submitFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const { synced, failed } = await replayQueue(submitFn);

    expect(synced).toBe(0);
    expect(failed).toBe(1);

    // El reporte debe seguir en cola para reintentarse
    const pending = await getPendingReports();
    expect(pending).toHaveLength(1);
  });

  it('procesa correctamente una cola mixta (éxitos y fallos)', async () => {
    await enqueueReport({ client_id: 'ok',   _clientRequestId: 'mix-ok'   }, 'tok');
    await enqueueReport({ client_id: 'fail', _clientRequestId: 'mix-fail' }, 'tok');

    const submitFn = vi.fn().mockImplementation(async (data) => {
      if (data.client_id === 'fail') throw new Error('server error');
    });

    const { synced, failed } = await replayQueue(submitFn);

    expect(synced).toBe(1);
    expect(failed).toBe(1);

    // Solo el fallido debe quedar en cola
    const pending = await getPendingReports();
    expect(pending).toHaveLength(1);
    expect(pending[0].data.client_id).toBe('fail');
  });

  it('devuelve { synced: 0, failed: 0 } cuando la cola está vacía', async () => {
    const submitFn = vi.fn();
    const result = await replayQueue(submitFn);

    expect(result).toEqual({ synced: 0, failed: 0 });
    expect(submitFn).not.toHaveBeenCalled();
  });
});