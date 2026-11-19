import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const [identifier, setIdentifier] = useState('operador@maternitysos.ao');
  const [password, setPassword] = useState('mamasalva123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { role: 'gravida', label: '1. Grávida', email: 'gravida@maternitysos.ao', name: 'Esperança Manuel (36 sem.)' },
    { role: 'cidadao', label: '2. Cidadão Auxílio', email: 'cidadao@maternitysos.ao', name: 'Domingos Sebastião' },
    { role: 'operador', label: '3. Operador Call Center', email: 'operador@maternitysos.ao', name: 'Teresa Neto (Central 114)' },
    { role: 'supervisor', label: '4. Supervisor Central', email: 'supervisor@maternitysos.ao', name: 'Dr. Rui Kapapelo' },
    { role: 'equipa_emergencia', label: '5. Equipa Resgate', email: 'equipa@maternitysos.ao', name: 'Enf. Mateus Kipupa (INEMA)' },
    { role: 'maternidade', label: '6. Maternidade', email: 'maternidade@maternitysos.ao', name: 'Maternidade Lucrécia Paim' },
    { role: 'administrador', label: '7. Administrador', email: 'admin@maternitysos.ao', name: 'Eng. Amílcar Cabral' },
  ];

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Falha ao efetuar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (acc) => {
    setIdentifier(acc.email);
    setPassword('mamasalva123');
  };

  const handleInstantDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(role);
    } catch (err) {
      setError(err.message || 'Falha ao carregar perfil demonstrativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B1120',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '36px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header institucional */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '8px',
              backgroundColor: '#B91C1C',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              border: '1px solid #EF4444',
              boxShadow: '0 4px 6px rgba(220, 38, 38, 0.35)',
            }}
          >
            SOS
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#F8FAFC' }}>
            MATERNITY SOS Luanda
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px' }}>
            Sistema Integrado de Gestão e Coordenação de Emergências Obstétricas
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: '#38BDF8',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            Província de Luanda | Pilar: Care | Saúde e Proteção Social
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid #DC2626',
              color: '#FCA5A5',
              padding: '12px 14px',
              borderRadius: '6px',
              fontSize: '13.5px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        {/* Formulário de Login Tradicional */}
        <form onSubmit={handleStandardLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13.5px', color: '#94A3B8', marginBottom: '6px', fontWeight: '500' }}>
              Identificador (Email institucional ou Telefone de Luanda)
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ex: operador@maternitysos.ao ou 923..."
              style={{ width: '100%', fontSize: '15px', padding: '11px 14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13.5px', color: '#94A3B8', marginBottom: '6px', fontWeight: '500' }}>
              Palavra-Passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', fontSize: '15px', padding: '11px 14px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              padding: '12px 18px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: '700',
              border: '1px solid #0369A1',
              marginTop: '6px',
              minHeight: '44px',
            }}
          >
            {loading ? 'A autenticar...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Quick Demo Switcher Section */}
        <div style={{ marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.04em' }}>
              ACESSO DEMONSTRATIVO EM 1 CLIQUE (7 PERFIS):
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Senha: mamasalva123</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {demoAccounts.map((acc) => (
              <div
                key={acc.role}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '9px 14px',
                  gap: '10px',
                }}
              >
                <div>
                  <span style={{ fontWeight: '700', color: '#F8FAFC', fontSize: '13.5px' }}>{acc.label}</span>
                  <span style={{ color: '#94A3B8', fontSize: '12.5px', marginLeft: '8px' }}>({acc.name})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    style={{
                      fontSize: '12px',
                      color: '#94A3B8',
                      padding: '4px 8px',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      backgroundColor: '#0F172A',
                    }}
                  >
                    Preencher
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstantDemo(acc.role)}
                    disabled={loading}
                    style={{
                      fontSize: '12.5px',
                      color: '#38BDF8',
                      fontWeight: '700',
                      padding: '5px 12px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      borderRadius: '4px',
                      border: '1px solid #0284C7',
                    }}
                  >
                    Entrar Direto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
