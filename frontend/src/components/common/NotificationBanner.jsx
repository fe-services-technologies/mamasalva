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
        right: '24px',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '460px',
        width: 'calc(100% - 48px)',
      }}
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid #DC2626',
            borderRadius: '8px',
            padding: '14px 18px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.45)',
            borderLeft: '5px solid #DC2626',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#EF4444',
                letterSpacing: '0.04em',
              }}
            >
              ALERTA OPERACIONAL DE REGULAÇÃO
            </span>
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{ color: '#94A3B8', fontSize: '16px', lineHeight: 1, padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#F8FAFC', marginTop: '6px', fontWeight: '500', lineHeight: 1.45 }}>
            {alert.motivo || alert.mensagem || 'Situação crítica identificada em Luanda.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
            {alert.bairro && <span>Zona: <strong style={{ color: '#CBD5E1' }}>{alert.bairro}</strong></span>}
            <span className="tabular-nums">{alert.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
