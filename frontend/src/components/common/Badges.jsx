import React from 'react';

export const PriorityBadge = ({ prioridade }) => {
  let bg = '#334155';
  let color = '#F8FAFC';
  let border = '#475569';
  let label = prioridade || 'Pendente';

  if (prioridade === 'Nível 1 - Vermelho') {
    bg = 'rgba(220, 38, 38, 0.2)';
    color = '#FCA5A5';
    border = '#DC2626';
    label = 'NÍVEL 1 — VERMELHO (CRÍTICO)';
  } else if (prioridade === 'Nível 2 - Amarelo') {
    bg = 'rgba(217, 119, 6, 0.2)';
    color = '#FCD34D';
    border = '#D97706';
    label = 'NÍVEL 2 — AMARELO (URGENTE)';
  } else if (prioridade === 'Nível 3 - Verde') {
    bg = 'rgba(5, 150, 105, 0.2)';
    color = '#6EE7B7';
    border = '#059669';
    label = 'NÍVEL 3 — VERDE (NÃO CRÍTICO)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '5px 11px',
        borderRadius: '5px',
        fontSize: '12.5px',
        fontWeight: '700',
        letterSpacing: '0.04em',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: border, flexShrink: 0 }} />
      {label}
    </span>
  );
};

export const StatusBadge = ({ estado }) => {
  let bg = '#1E293B';
  let color = '#94A3B8';
  let border = '#334155';

  if (estado === 'Nova' || estado === 'Em Triagem') {
    bg = '#1E3A8A';
    color = '#93C5FD';
    border = '#2563EB';
  } else if (estado === 'Aguardando Despacho') {
    bg = 'rgba(217, 119, 6, 0.22)';
    color = '#FDE68A';
    border = '#D97706';
  } else if (estado === 'Ambulância a Caminho' || estado === 'Equipa no Local') {
    bg = 'rgba(14, 165, 233, 0.22)';
    color = '#7DD3FC';
    border = '#0284C7';
  } else if (estado === 'Em Transporte para Maternidade' || estado === 'Chegada à Maternidade') {
    bg = 'rgba(147, 51, 234, 0.22)';
    color = '#D8B4FE';
    border = '#9333EA';
  } else if (estado === 'Recepção Confirmada' || estado === 'Concluída') {
    bg = 'rgba(16, 185, 129, 0.22)';
    color = '#6EE7B7';
    border = '#059669';
  } else if (estado === 'Sob Revisão de Suspeita') {
    bg = 'rgba(239, 68, 68, 0.22)';
    color = '#FCA5A5';
    border = '#EF4444';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {estado}
    </span>
  );
};

export const RoadAccessibilityBadge = ({ classificacao, pontoEncontro }) => {
  let bg = 'rgba(16, 185, 129, 0.16)';
  let color = '#34D399';
  let border = '#059669';
  let icon = '✓';

  if (classificacao === 'Acesso impossível para ambulância convencional') {
    bg = 'rgba(239, 68, 68, 0.22)';
    color = '#F87171';
    border = '#DC2626';
    icon = '⚠';
  } else if (classificacao === 'Acesso condicionado') {
    bg = 'rgba(245, 158, 11, 0.22)';
    color = '#FBBF24';
    border = '#D97706';
    icon = '▲';
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '5px',
          fontSize: '12.5px',
          fontWeight: '600',
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
        }}
      >
        <span style={{ fontSize: '13px' }}>{icon}</span>
        {classificacao}
      </span>
      {classificacao === 'Acesso impossível para ambulância convencional' && pontoEncontro && (
        <span style={{ fontSize: '12px', color: '#E2E8F0', paddingLeft: '4px', lineHeight: 1.4 }}>
          Ponto de Encontro: <strong>{pontoEncontro}</strong>
        </span>
      )}
    </div>
  );
};

export const LifecycleStepTracker = ({ etapaAtual = 1, estado }) => {
  const etapas = [
    { num: 1, label: 'Solicitação' },
    { num: 2, label: 'Registo' },
    { num: 3, label: 'Triagem' },
    { num: 4, label: 'Socorro' },
    { num: 5, label: 'Encaminhamento' },
    { num: 6, label: 'Recepção' },
  ];

  return (
    <div style={{ padding: '10px 0', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Connecting line */}
        <div
          style={{
            position: 'absolute',
            top: '15px',
            left: '5%',
            right: '5%',
            height: '3px',
            backgroundColor: '#334155',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '15px',
            left: '5%',
            width: `${((Math.min(etapaAtual, 6) - 1) / 5) * 90}%`,
            height: '3px',
            backgroundColor: '#0284C7',
            zIndex: 2,
            transition: 'width 0.4s ease',
          }}
        />

        {etapas.map((step) => {
          const isPassed = step.num < etapaAtual;
          const isCurrent = step.num === etapaAtual;
          const isCompleted = etapaAtual === 6 && (estado === 'Recepção Confirmada' || estado === 'Concluída');

          let circleBg = '#1E293B';
          let circleBorder = '#475569';
          let textColor = '#94A3B8';

          if (isPassed || isCompleted) {
            circleBg = '#0369A1';
            circleBorder = '#38BDF8';
            textColor = '#38BDF8';
          } else if (isCurrent) {
            circleBg = '#0284C7';
            circleBorder = '#BAE6FD';
            textColor = '#FFFFFF';
          }

          return (
            <div
              key={step.num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
                minWidth: '56px',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: circleBg,
                  border: `2px solid ${circleBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: textColor,
                  boxShadow: isCurrent ? '0 0 0 3px rgba(2, 132, 199, 0.3)' : 'none',
                }}
              >
                {isPassed || isCompleted ? '✓' : step.num}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: isCurrent ? '700' : '500',
                  color: isCurrent ? '#F8FAFC' : '#94A3B8',
                  marginTop: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
