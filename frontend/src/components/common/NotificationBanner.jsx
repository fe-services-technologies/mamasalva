import React from 'react';
import { useSocket } from '../../context/SocketContext';

export const NotificationBanner = () => {
  const { alerts, dismissAlert } = useSocket();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '74px',
        right: '20px',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '440px',
        width: 'calc(100% - 40px)',
      }}
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #FECACA',
            borderLeft: '5px solid #DC2626',
            borderRadius: '10px',
            padding: '14px 18px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: '800',
                color: '#DC2626',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              ALERTA OPERACIONAL DE REGULAÇÃO
            </span>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{ color: '#94A3B8', fontSize: '15px', lineHeight: 1, padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '13.5px', color: '#0F172A', marginTop: '6px', fontWeight: '600', lineHeight: 1.45 }}>
            {alert.message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: '#64748B' }}>
            <span>Protocolo: {alert.protocolo || 'N/A'}</span>
            <span>{new Date(alert.timestamp).toLocaleTimeString('pt-PT')}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
