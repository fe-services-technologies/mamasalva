import React, { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = '640px' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '8px',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F8FAFC' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '13.5px', color: '#94A3B8', marginTop: '3px' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              color: '#94A3B8',
              fontSize: '20px',
              padding: '6px 10px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', fontSize: '14.5px' }}>{children}</div>
      </div>
    </div>
  );
};
