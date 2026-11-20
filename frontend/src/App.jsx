import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { NotificationBanner } from './components/common/NotificationBanner';
import { UssdSimulator } from './components/channels/UssdSimulator';
import { SmsLogDrawer } from './components/channels/SmsLogDrawer';
import { ContingencyModal } from './components/common/ContingencyModal';

// Páginas
import { LoginPage } from './pages/LoginPage';
import { GravidaPortal } from './pages/GravidaPortal';
import { CallCenterDashboard } from './pages/CallCenterDashboard';
import { SupervisorDashboard } from './pages/SupervisorDashboard';
import { EmergencyTeamDashboard } from './pages/EmergencyTeamDashboard';
import { MaternityDashboard } from './pages/MaternityDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export const App = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const [ussdOpen, setUssdOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [contingencyOpen, setContingencyOpen] = useState(false);

  // Admin testing view: permite ao administrador inspecionar a App da Gestante em ecrã dedicado
  const [adminTestingAppMode, setAdminTestingAppMode] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid #E0F2FE',
            borderTopColor: '#0284C7',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
          A carregar sistema MATERNITY SOS Luanda...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const isPregnantOrCitizen = user.perfil === 'gravida' || user.perfil === 'cidadao';
  const isAdmin = user.perfil === 'administrador';

  // =========================================================================
  // CASO 1: ÁREA DA GESTANTE / UTILIZADOR (APP MAPP-FIRST, ULTRA SIMPLES)
  // Totalmente isolada, sem ferramentas de backoffice ou botões de desenvolvedor
  // =========================================================================
  if (isPregnantOrCitizen || (isAdmin && adminTestingAppMode)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Banner discreto apenas se for o Administrador a testar a app do utente */}
        {isAdmin && adminTestingAppMode && (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #BFDBFE',
              padding: '8px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12.5px',
            }}
          >
            <span style={{ color: '#1E40AF', fontWeight: '700' }}>
              👁️ Modo de Teste: Está a visualizar a interface simplificada da Grávida.
            </span>
            <button
              onClick={() => setAdminTestingAppMode(false)}
              style={{
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              ⬅️ Voltar ao Painel do Administrador
            </button>
          </div>
        )}

        {/* Cabeçalho da App da Grávida */}
        <Header />

        {/* Notificações em tempo real */}
        <NotificationBanner />

        {/* Conteúdo Exclusivo da Grávida / App */}
        <main style={{ flex: 1, paddingBottom: '30px' }}>
          <GravidaPortal />
        </main>
      </div>
    );
  }

  // =========================================================================
  // CASO 2: ÁREA DO ADMINISTRADOR & EQUIPA HOSPITALAR (TELA PROFISSIONAL)
  // Painel clínico completo, complexo e com todas as ferramentas de regulação
  // =========================================================================
  const renderProfessionalDashboard = () => {
    switch (user.perfil) {
      case 'administrador':
        return (
          <AdminDashboard
            onOpenUssd={() => setUssdOpen(true)}
            onOpenSms={() => setSmsOpen(true)}
            onOpenContingency={() => setContingencyOpen(true)}
          />
        );
      case 'operador':
        return <CallCenterDashboard />;
      case 'supervisor':
        return <SupervisorDashboard />;
      case 'equipa_emergencia':
        return <EmergencyTeamDashboard />;
      case 'maternidade':
        return <MaternityDashboard />;
      default:
        return (
          <AdminDashboard
            onOpenUssd={() => setUssdOpen(true)}
            onOpenSms={() => setSmsOpen(true)}
            onOpenContingency={() => setContingencyOpen(true)}
          />
        );
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
      }}
    >
      {/* Barra de Acesso e Alternância Exclusiva para o Administrador */}
      {isAdmin && (
        <div
          style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            padding: '7px 24px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span style={{ fontWeight: '700', letterSpacing: '0.03em' }}>
              PORTAL ADMINISTRATIVO MATERNITY SOS — SESSÃO SEGURA
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setAdminTestingAppMode(true)}
              style={{
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #334155',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: '700',
              }}
            >
              📱 Visualizar App da Grávida
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho Hospitalar Oficial */}
      <Header
        isAdminView={true}
        onOpenUssd={() => setUssdOpen(true)}
        onOpenSms={() => setSmsOpen(true)}
        onOpenContingency={() => setContingencyOpen(true)}
      />

      {/* Notificações em Tempo Real */}
      <NotificationBanner />

      {/* Conteúdo Dinâmico do Painel Administrativo / Profissional */}
      <main style={{ paddingBottom: '40px' }}>
        {renderProfessionalDashboard()}
      </main>

      {/* Modais de Ferramentas Técnicas do Administrador */}
      <UssdSimulator
        isOpen={ussdOpen}
        onClose={() => setUssdOpen(false)}
      />

      <SmsLogDrawer
        isOpen={smsOpen}
        onClose={() => setSmsOpen(false)}
      />

      <ContingencyModal
        isOpen={contingencyOpen}
        onClose={() => setContingencyOpen(false)}
      />
    </div>
  );
};

export default App;
