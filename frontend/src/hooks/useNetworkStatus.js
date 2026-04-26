import { useState, useEffect } from 'react';

/**
 * Hook para monitorear el estado de la conexión de red.
 * @returns {{ isOnline: boolean, wasOffline: boolean }} Estado actual de la red.
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (!navigator.onLine) return; // guard
      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((sw) => {
          sw.sync.register('sync-reports').catch(console.warn);
        });
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Listen for SW sync messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = (event) => {
      if (event.data?.type === 'REPORT_SYNCED') {
        console.log('[PWA] Report synced from offline queue:', event.data.id);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  return { isOnline, wasOffline };
};
