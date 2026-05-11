import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * OfflineBanner
 * Shows a persistent banner when the user is offline.
 * Shows a transient "back online" confirmation when connection restores.
 */
const OfflineBanner = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowOnline(true);
      const t = setTimeout(() => setShowOnline(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div
        role="alert"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#1e3a5f',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '10px 16px',
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 600,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.3s ease-out',
        }}
      >
        <span style={{ fontSize: '18px' }}>📡</span>
        <span>Sin conexión — Los datos guardados siguen disponibles. Los nuevos reportes se sincronizarán al reconectar.</span>
        <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`}</style>
      </div>
    );
  }

  if (showOnline) {
    return (
      <div
        role="status"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#166534',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '10px 16px',
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 600,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.3s ease-out',
        }}
      >
        <span style={{ fontSize: '18px' }}>✅</span>
        <span>Conexión restaurada — Sincronizando reportes pendientes...</span>
      </div>
    );
  }

  return null;
};

export default OfflineBanner;
