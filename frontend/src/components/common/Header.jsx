import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onOpenUssd, onOpenSms, onOpenContingency, isAdminView = false, onTogglePortal }) => {
  const { user, logout } = useAuth();

  const isUserPortal = user?.perfil === 'gravida' || user?.perfil === 'cidadao';

  // If in user/app mode, render a friendly, reassuring mobile/web app header
  if (isUserPortal && !isAdminView) {
    return (
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Brand - MATERNITY SOS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '800',
                boxShadow: '0 3px 8px rgba(220, 38, 38, 0.28)',
                flexShrink: 0,
              }}
            >
              ♥
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
                  MATERNITY SOS
                </h1>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    backgroundColor: '#E0F2FE',
                    color: '#0284C7',
                    fontWeight: '700',
                  }}
                >
                  Luanda
                </span>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '1px' }}>
                Apoio e Socorro Obstétrico Imediato
              </p>
            </div>
          </div>

          {/* Quick Call 114 Button & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="tel:114"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 3px 6px rgba(220, 38, 38, 0.25)',
              }}
            >
              <span style={{ fontSize: '17px' }}>📞</span>
              <span>Ligar 114</span>
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={logout}
                title="Sair da aplicação"
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '700',
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Administrator / Hospital Staff Header
  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Brand & Hospital Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '16px',
            color: '#FFFFFF',
            backgroundColor: '#DC2626',
            boxShadow: '0 3px 6px rgba(220, 38, 38, 0.28)',
            flexShrink: 0,
          }}
        >
          SOS
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '21px', fontWeight: '800', letterSpacing: '-0.02em', color: '#0F172A' }}>
              MATERNITY SOS
            </h1>
            <span
              style={{
                fontSize: '13px',
                padding: '3px 10px',
                borderRadius: '5px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontWeight: '700',
              }}
            >
              Área Administrativa & Central 114
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
            Coordenação de Emergências Obstétricas da Província de Luanda
          </p>
        </div>
      </div>

      {/* Emergency Hotlines Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          backgroundColor: '#F8FAFC',
          padding: '8px 18px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          fontSize: '14.5px',
        }}
      >
        <span style={{ color: '#64748B', fontWeight: '600' }}>Linhas Oficiais:</span>
        <span style={{ fontWeight: '800', color: '#DC2626' }}>Central 114</span>
        <span style={{ color: '#CBD5E1' }}>|</span>
        <span style={{ fontWeight: '800', color: '#0284C7' }}>INEMA 112</span>
        <span style={{ color: '#CBD5E1' }}>|</span>
        <span style={{ fontWeight: '800', color: '#D97706' }}>Bombeiros 115</span>
      </div>

      {/* Admin Action Tools & User Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {onOpenUssd && (
          <button
            onClick={onOpenUssd}
            style={{
              fontSize: '14px',
              padding: '8px 15px',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: '700',
            }}
          >
            📱 Simulador USSD
          </button>
        )}

        {onOpenSms && (
          <button
            onClick={onOpenSms}
            style={{
              fontSize: '14px',
              padding: '8px 15px',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: '700',
            }}
          >
            ✉️ Gateway SMS
          </button>
        )}

        {onOpenContingency && (
          <button
            onClick={onOpenContingency}
            style={{
              fontSize: '14px',
              padding: '8px 15px',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '8px',
              color: '#1D4ED8',
              fontWeight: '700',
            }}
          >
            📋 Protocolos
          </button>
        )}

        {/* User Info & Logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '12px',
            borderLeft: '1.5px solid #E2E8F0',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              {user?.nome || 'Administrador'}
            </div>
            <div style={{ fontSize: '13px', color: '#0284C7', fontWeight: '700' }}>
              {user?.perfil === 'administrador' ? 'Administrador Geral' : user?.perfil}
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              fontSize: '14px',
              padding: '8px 14px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              fontWeight: '700',
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
