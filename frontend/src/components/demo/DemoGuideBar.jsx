import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const DemoGuideBar = ({ onTriggerScenario1, onTriggerScenario2 }) => {
  const { user, demoLogin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  const profiles = [
    { key: 'gravida', label: '1. Grávida', person: 'Esperança Manuel' },
    { key: 'cidadao', label: '2. Cidadão', person: 'Domingos Sebastião' },
    { key: 'operador', label: '3. Operador 114', person: 'Teresa Neto' },
    { key: 'supervisor', label: '4. Supervisor', person: 'Dr. Rui Kapapelo' },
    { key: 'equipa_emergencia', label: '5. Equipa INEMA', person: 'Enf. Mateus Kipupa' },
    { key: 'maternidade', label: '6. Maternidade', person: 'Lucrécia Paim' },
    { key: 'administrador', label: '7. Admin', person: 'Eng. Amílcar Cabral' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#0A2540',
        borderBottom: '1px solid #1E3A8A',
        padding: '8px 24px',
        fontSize: '13.5px',
        color: '#BAE6FD',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontWeight: '700',
            backgroundColor: '#1E40AF',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            letterSpacing: '0.05em',
          }}
        >
          GUIA DE DEMONSTRAÇÃO
        </span>
        <span style={{ fontWeight: '500' }}>Alternar Perfil em 1 Clique:</span>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {profiles.map((p) => {
            const isSelected = user && user.perfil === p.key;
            return (
              <button
                key={p.key}
                onClick={() => demoLogin(p.key)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '5px',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? '700' : '500',
                  backgroundColor: isSelected ? '#38BDF8' : '#1E293B',
                  color: isSelected ? '#0F172A' : '#E2E8F0',
                  border: isSelected ? '1px solid #7DD3FC' : '1px solid #334155',
                  minHeight: '32px',
                }}
                title={`Entrar como ${p.person} (${p.label})`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setActiveScenario(1);
            if (onTriggerScenario1) onTriggerScenario1();
          }}
          style={{
            backgroundColor: activeScenario === 1 ? '#0284C7' : '#1E293B',
            color: '#FFFFFF',
            padding: '5px 12px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: '1px solid #38BDF8',
            minHeight: '32px',
          }}
        >
          Cenário 1: Fluxo 6 Etapas (L1 Crítico)
        </button>

        <button
          onClick={() => {
            setActiveScenario(2);
            if (onTriggerScenario2) onTriggerScenario2();
          }}
          style={{
            backgroundColor: activeScenario === 2 ? '#B45309' : '#1E293B',
            color: '#FDE68A',
            padding: '5px 12px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontWeight: '600',
            border: '1px solid #F59E0B',
            minHeight: '32px',
          }}
        >
          Cenário 2: Acesso Impossível Luanda
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            color: '#93C5FD',
            fontSize: '12.5px',
            fontWeight: '500',
            textDecoration: 'underline',
            padding: '4px 6px',
          }}
        >
          {isOpen ? 'Ocultar Explicação' : 'Como Avaliar?'}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #1E3A8A',
            borderRadius: '6px',
            padding: '14px 18px',
            marginTop: '8px',
            color: '#E2E8F0',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            <div>
              <strong style={{ color: '#38BDF8', fontSize: '13.5px' }}>Roteiro do Cenário 1 (Emergência Completa):</strong>
              <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>Selecione <strong>1. Grávida</strong> ou <strong>2. Cidadão</strong> e clique em <em>ESTOU A PASSAR MAL</em> ou <em>PEDIR AJUDA</em>.</li>
                <li>Alterne para <strong>3. Operador 114</strong>: veja a ocorrência na fila L1, valide a triagem e despache a ambulância INEMA.</li>
                <li>Alterne para <strong>5. Equipa INEMA</strong>: avance a simulação do trajeto no mapa de Luanda e atualize para <em>No Local</em> / <em>Em Transporte</em>.</li>
                <li>Alterne para <strong>6. Maternidade</strong>: receba a notificação e clique em <em>Confirmar Recepção</em> (Etapa 6 concluída).</li>
              </ol>
            </div>
            <div>
              <strong style={{ color: '#F59E0B', fontSize: '13.5px' }}>Roteiro do Cenário 2 (Zonas de Difícil Acesso em Luanda):</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>Abra uma solicitação no bairro <strong>Tala Hady (Cazenga)</strong> ou <strong>Ngola Kiluanje (Sambizanga)</strong>.</li>
                <li>O sistema identifica automaticamente: <em>Acesso impossível para ambulância convencional</em>.</li>
                <li>Define o ponto de encontro alternativo (ex: Esquadra da 5ª Avenida) e emite alerta imediato na tela do <strong>4. Supervisor</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
