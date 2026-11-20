import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ initialPortal = 'app' }) => {
  const { login, demoLogin } = useAuth();
  const [activePortal, setActivePortal] = useState(initialPortal); // 'app' or 'admin'

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const adminAccounts = [
    { role: 'administrador', label: 'Administrador Geral', name: 'Eng. Amílcar Cabral', email: 'admin@maternitysos.ao' },
    { role: 'operador', label: 'Operador Call Center 114', name: 'Teresa Neto', email: 'operador@maternitysos.ao' },
    { role: 'supervisor', label: 'Supervisor Central de Regulação', name: 'Dr. Rui Kapapelo', email: 'supervisor@maternitysos.ao' },
    { role: 'equipa_emergencia', label: 'Equipa Resgate INEMA', name: 'Enf. Mateus Kipupa', email: 'equipa@maternitysos.ao' },
    { role: 'maternidade', label: 'Maternidade Lucrécia Paim', name: 'Dra. Luísa Faria', email: 'maternidade@maternitysos.ao' },
  ];

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Falha ao efetuar autenticação. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(role);
    } catch (err) {
      setError(err.message || 'Falha ao aceder ao perfil demonstrativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      {/* Top Brand Banner */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.28)',
          }}
        >
          ♥
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
          MATERNITY SOS • Luanda
        </h1>
        <p style={{ fontSize: '16px', color: '#64748B', marginTop: '4px' }}>
          Sistema Integrado de Emergências Obstétricas da Província de Luanda
        </p>
      </div>

      {/* Main Container Card (Escala 125% generosa) */}
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.06), 0 8px 12px -6px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Clear Separation Tabs: App da Gestante vs Portal Administrativo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: '#F1F5F9',
            padding: '6px',
            borderRadius: '12px',
            marginBottom: '28px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActivePortal('app');
              setError('');
            }}
            style={{
              padding: '13px 16px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: activePortal === 'app' ? '800' : '600',
              backgroundColor: activePortal === 'app' ? '#FFFFFF' : 'transparent',
              color: activePortal === 'app' ? '#0F172A' : '#64748B',
              boxShadow: activePortal === 'app' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              border: activePortal === 'app' ? '1px solid #CBD5E1' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🤰</span>
            <span>App da Gestante</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('admin');
              setError('');
            }}
            style={{
              padding: '13px 16px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: activePortal === 'admin' ? '800' : '600',
              backgroundColor: activePortal === 'admin' ? '#FFFFFF' : 'transparent',
              color: activePortal === 'admin' ? '#0F172A' : '#64748B',
              boxShadow: activePortal === 'admin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              border: activePortal === 'admin' ? '1px solid #CBD5E1' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🏥</span>
            <span>Área da Administração</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#991B1B',
              padding: '14px 18px',
              borderRadius: '10px',
              fontSize: '15px',
              marginBottom: '22px',
              fontWeight: '600',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 1. SEÇÃO DO UTILIZADOR / APP DA GRÁVIDA (ULTRA SIMPLES) */}
        {activePortal === 'app' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  border: '2.5px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                🤰
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>
                Bem-vinda ao MATERNITY SOS
              </h2>
              <p style={{ fontSize: '16px', color: '#64748B', marginTop: '6px', lineHeight: 1.5 }}>
                Aplicação simples e rápida para pedir socorro médico obstétrico em qualquer bairro de Luanda.
              </p>
            </div>

            {/* Botão de Entrada Rápida em 1 Toque para a Gestante */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                type="button"
                onClick={() => handleDirectDemo('gravida')}
                disabled={loading}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '18px 24px',
                  borderRadius: '14px',
                  fontSize: '18px',
                  fontWeight: '800',
                  boxShadow: '0 5px 14px rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  border: 'none',
                }}
              >
                <span style={{ fontSize: '20px' }}>✨</span>
                <span>{loading ? 'A aceder à App...' : 'Entrar na App MATERNITY SOS (Esperança Manuel)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectDemo('cidadao')}
                disabled={loading}
                style={{
                  backgroundColor: '#F0F9FF',
                  color: '#0284C7',
                  border: '1.5px solid #BAE6FD',
                  padding: '15px 20px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '18px' }}>🤝</span>
                <span>Entrar como Acompanhante / Cidadão (Ajudar Vizinha)</span>
              </button>
            </div>

            {/* Informação calorosa de apoio */}
            <div
              style={{
                marginTop: '26px',
                padding: '16px 18px',
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.55,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>ℹ️</span>
                <span>Emergência Direta em Luanda:</span>
              </div>
              Pode também ligar gratuitamente para o número <strong>114</strong> ou marcar <strong>*114#</strong> sem gastar saldo no seu telemóvel.
            </div>
          </div>
        )}

        {/* 2. SEÇÃO DO ADMINISTRADOR & HOSPITAL (COMPLEXA E COMPLETA) */}
        {activePortal === 'admin' && (
          <div>
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
                Acesso Administrativo & Operacional
              </h2>
              <p style={{ fontSize: '15px', color: '#64748B', marginTop: '4px' }}>
                Painel reservado para gestão do sistema, regulação médica e equipas de Luanda.
              </p>
            </div>

            {/* Login com Credenciais */}
            <form onSubmit={handleStandardLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Email Institucional ou Identificador
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin@maternitysos.ao"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Palavra-Passe
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '800',
                  marginTop: '6px',
                }}
              >
                {loading ? 'A autenticar...' : 'Entrar no Painel Administrativo'}
              </button>
            </form>

            {/* Perfis Rápidos Administrativos */}
            <div style={{ marginTop: '28px', paddingTop: '22px', borderTop: '1.5px solid #E2E8F0' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                Acesso Demonstrativo Rápido aos Perfis Técnicos:
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {adminAccounts.map((acc) => (
                  <div
                    key={acc.role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                        {acc.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748B' }}>
                        {acc.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDirectDemo(acc.role)}
                      disabled={loading}
                      style={{
                        padding: '7px 16px',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#0284C7',
                      }}
                    >
                      Aceder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#94A3B8' }}>
        Governo Provincial de Luanda • Ministério da Saúde • Direção Provincial de Saúde
      </div>
    </div>
  );
};
