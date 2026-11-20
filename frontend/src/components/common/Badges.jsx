import React from 'react';

export const PriorityBadge = ({ prioridade }) => {
  let bg = '#F1F5F9';
  let color = '#334155';
  let border = '#CBD5E1';
  let dot = '#64748B';
  let label = prioridade || 'Pendente';

  if (prioridade === 'Nível 1 - Vermelho') {
    bg = '#FEF2F2';
    color = '#991B1B';
    border = '#FCA5A5';
    dot = '#DC2626';
    label = 'NÍVEL 1 — VERMELHO (CRÍTICO)';
  } else if (prioridade === 'Nível 2 - Amarelo') {
    bg = '#FFFBEB';
    color = '#92400E';
    border = '#FDE68A';
    dot = '#D97706';
    label = 'NÍVEL 2 — AMARELO (URGENTE)';
  } else if (prioridade === 'Nível 3 - Verde') {
    bg = '#ECFDF5';
    color = '#065F46';
    border = '#A7F3D0';
    dot = '#059669';
    label = 'NÍVEL 3 — VERDE (NÃO CRÍTICO)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: '800',
        letterSpacing: '0.03em',
        backgroundColor: bg,
        color: color,
        border: `1.5px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
      {label}
    </span>
  );
};

export const StatusBadge = ({ estado }) => {
  let bg = '#F1F5F9';
  let color = '#475569';
  let border = '#CBD5E1';

  if (estado === 'Nova' || estado === 'Em Triagem') {
    bg = '#EFF6FF';
    color = '#1D4ED8';
    border = '#BFDBFE';
  } else if (estado === 'Aguardando Despacho') {
    bg = '#FFFBEB';
    color = '#B45309';
    border = '#FDE68A';
  } else if (estado === 'Ambulância a Caminho' || estado === 'Equipa no Local') {
    bg = '#F0F9FF';
    color = '#0284C7';
    border = '#BAE6FD';
  } else if (estado === 'Em Transporte para Maternidade' || estado === 'Chegada à Maternidade') {
    bg = '#FAF5FF';
    color = '#7E22CE';
    border = '#E9D5FF';
  } else if (estado === 'Recepção Confirmada' || estado === 'Concluída') {
    bg = '#ECFDF5';
    color = '#047857';
    border = '#A7F3D0';
  } else if (estado === 'Sob Revisão de Suspeita') {
    bg = '#FEF2F2';
    color = '#B91C1C';
    border = '#FECACA';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: '700',
        backgroundColor: bg,
        color: color,
        border: `1.5px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {estado}
    </span>
  );
};

export const RoadAccessibilityBadge = ({ classificacao, pontoEncontro }) => {
  let bg = '#ECFDF5';
  let color = '#047857';
  let border = '#A7F3D0';
  let icon = '✓';

  if (classificacao === 'Acesso impossível para ambulância convencional') {
    bg = '#FEF2F2';
    color = '#B91C1C';
    border = '#FECACA';
    icon = '⚠️';
  } else if (classificacao === 'Acesso condicionado') {
    bg = '#FFFBEB';
    color = '#B45309';
    border = '#FDE68A';
    icon = '▲';
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '5px' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '700',
          backgroundColor: bg,
          color: color,
          border: `1.5px solid ${border}`,
        }}
      >
        <span style={{ fontSize: '15px' }}>{icon}</span>
        {classificacao}
      </span>
      {classificacao === 'Acesso impossível para ambulância convencional' && pontoEncontro && (
        <span style={{ fontSize: '13.5px', color: '#64748B', paddingLeft: '4px', lineHeight: 1.45 }}>
          Ponto de Encontro: <strong style={{ color: '#0F172A' }}>{pontoEncontro}</strong>
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
    { num: 5, label: 'Transporte' },
    { num: 6, label: 'Hospital' },
  ];

  return (
    <div style={{ padding: '12px 0', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Connecting line */}
        <div
          style={{
            position: 'absolute',
            top: '18px',
            left: '5%',
            right: '5%',
            height: '4px',
            backgroundColor: '#E2E8F0',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '18px',
            left: '5%',
            width: `${((Math.min(etapaAtual, 6) - 1) / 5) * 90}%`,
            height: '4px',
            backgroundColor: '#0284C7',
            zIndex: 2,
            transition: 'width 0.4s ease',
          }}
        />

        {etapas.map((step) => {
          const isPassed = step.num < etapaAtual;
          const isCurrent = step.num === etapaAtual;
          const isCompleted = etapaAtual === 6 && (estado === 'Recepção Confirmada' || estado === 'Concluída');

          let circleBg = '#FFFFFF';
          let circleBorder = '#CBD5E1';
          let textColor = '#64748B';

          if (isPassed || isCompleted) {
            circleBg = '#E0F2FE';
            circleBorder = '#0284C7';
            textColor = '#0284C7';
          } else if (isCurrent) {
            circleBg = '#0284C7';
            circleBorder = '#0284C7';
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
                minWidth: '58px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: circleBg,
                  border: `2.5px solid ${circleBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '800',
                  color: textColor,
                  boxShadow: isCurrent ? '0 0 0 5px rgba(2, 132, 199, 0.2)' : 'none',
                }}
              >
                {isPassed || isCompleted ? '✓' : step.num}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: isCurrent ? '800' : '600',
                  color: isCurrent ? '#0284C7' : '#64748B',
                  marginTop: '8px',
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
