import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { DemoGuideBar } from './components/demo/DemoGuideBar';
import { NotificationBanner } from './components/common/NotificationBanner';
import { UssdSimulator } from './components/channels/UssdSimulator';
import { SmsLogDrawer } from './components/channels/SmsLogDrawer';
import { ContingencyModal } from './components/common/ContingencyModal';

// Páginas dos 7 perfis
import { LoginPage } from './pages/LoginPage';
import { GravidaPortal } from './pages/GravidaPortal';
import { CallCenterDashboard } from './pages/CallCenterDashboard';
import { SupervisorDashboard } from './pages/SupervisorDashboard';
import { EmergencyTeamDashboard } from './pages/EmergencyTeamDashboard';
import { MaternityDashboard } from './pages/MaternityDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export const App = () => {
  const { user, isAuthenticated, loading, demoLogin } = useAuth();

  const [ussdOpen, setUssdOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [contingencyOpen, setContingencyOpen] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0B1120',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38BDF8',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        A carregar sistema MATERNITY SOS...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Acionadores dos Cenários de Demonstração
  const handleScenario1 = () => {
    // Altera para grávida para iniciar a solicitação ou para operador
    demoLogin('gravida');
  };

  const handleScenario2 = () => {
    // Cenário de acesso impossível: vai para operador/supervisor
    demoLogin('supervisor');
  };

  const renderRoleDashboard = () => {
    switch (user.perfil) {
      case 'gravida':
      case 'cidadao':
        return <GravidaPortal />;
      case 'operador':
        return <CallCenterDashboard />;
      case 'supervisor':
        return <SupervisorDashboard />;
      case 'equipa_emergencia':
        return <EmergencyTeamDashboard />;
      case 'maternidade':
        return <MaternityDashboard />;
      case 'administrador':
        return <AdminDashboard />;
      default:
        return <GravidaPortal />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1120', color: '#F8FAFC' }}>
      {/* Guia Demonstrativo Superior */}
      <DemoGuideBar
        onTriggerScenario1={handleScenario1}
        onTriggerScenario2={handleScenario2}
      />

      {/* Cabeçalho Institucional */}
      <Header
        onOpenUssd={() => setUssdOpen(true)}
        onOpenSms={() => setSmsOpen(true)}
        onOpenContingency={() => setContingencyOpen(true)}
      />

      {/* Banner de Notificações em Tempo Real */}
      <NotificationBanner />

      {/* Conteúdo Dinâmico por Perfil */}
      <main style={{ paddingBottom: '40px' }}>{renderRoleDashboard()}</main>

      {/* Modais Globais de Canais e Contingência */}
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
