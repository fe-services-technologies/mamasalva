import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onOpenUssd, onOpenSms, onOpenContingency }) => {
  const { user, logout } = useAuth();

  const getProfileTitle = (perfil) => {
    switch (perfil) {
      case 'gravida': return 'Utente / Grávida';
      case 'cidadao': return 'Cidadão / Acompanhante';
      case 'operador': return 'Operador Call Center 114';
      case 'supervisor': return 'Supervisor Central de Regulação';
      case 'equipa_emergencia': return 'Equipa de Resgate / Ambulância';
      case 'maternidade': return 'Recepção Obstétrica Hospitalar';
      case 'administrador': return 'Administrador de Sistema';
      default: return perfil;
    }
  };

  return (
    <header
      style={{
        backgroundColor: '#0F172A',
        borderBottom: '1px solid #1E293B',
        padding: '14px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      {/* Brand & Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '15px',
            color: '#FFFFFF',
            border: '1px solid #DC2626',
            backgroundColor: '#B91C1C',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)',
            flexShrink: 0,
          }}
        >
          SOS
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: '#F8FAFC' }}>
              MATERNITY SOS
            </h1>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                color: '#FCA5A5',
                fontWeight: '700',
              }}
            >
              Luanda / Care
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
            Sistema Integrado de Gestão e Coordenação de Emergências Obstétricas
          </p>
        </div>
      </div>

      {/* Emergency Hotlines Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          backgroundColor: '#0B1120',
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid #1E293B',
          fontSize: '13.5px',
        }}
      >
        <span style={{ color: '#94A3B8' }}>Contactos de Socorro:</span>
        <span style={{ fontWeight: '700', color: '#EF4444' }}>Central 114</span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ fontWeight: '700', color: '#38BDF8' }}>INEMA 112</span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ fontWeight: '700', color: '#F59E0B' }}>Bombeiros 115</span>
      </div>

      {/* Tools & Current User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={onOpenUssd}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            backgroundColor: '#1E293B',
            color: '#E2E8F0',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #334155',
            minHeight: '38px',
          }}
          title="Abrir simulador interativo de código USSD para redes móveis"
        >
          Simulador USSD (*114#)
        </button>

        <button
          onClick={onOpenSms}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            backgroundColor: '#1E293B',
            color: '#E2E8F0',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #334155',
            minHeight: '38px',
          }}
        >
          Mensagens SMS
        </button>

        <button
          onClick={onOpenContingency}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            backgroundColor: '#1E293B',
            color: '#FCD34D',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #78350F',
            minHeight: '38px',
          }}
          title="Instruções para contingência: falha de internet, falha de GPS ou ambulâncias indisponíveis"
        >
          Contingências
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '6px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#F8FAFC' }}>
                {user.nome}
              </div>
              <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: '500' }}>
                {getProfileTitle(user.perfil)}
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#FCA5A5',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                minHeight: '38px',
              }}
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
