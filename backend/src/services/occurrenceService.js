const db = require('../db');
const { logAudit } = require('./auditService');
const { emitToAll, emitToCentral, emitToOccurrence, emitToRole, emitToUser } = require('../realtime/socketHandler');

// Protocol-based suggestion of priority
const evaluateObstetricPriority = (sinaisAlerta = [], descricao = '') => {
  const text = `${sinaisAlerta.join(' ')} ${descricao}`.toLowerCase();

  // Critical L1 indicators (Immediate emergency)
  const l1Keywords = [
    'hemorragia', 'sangramento abundante', 'convuls', 'eclâmpsia', 'inconsciente',
    'desmaio', 'expulsão', 'saída do feto', 'cabeça a sair', 'prolapso de cordão',
    'falta de ar severa', 'dor súbita intensa', 'pressão muito alta', 'visão turva'
  ];

  // Urgent L2 indicators (Priority evaluation)
  const l2Keywords = [
    'perda de líquido', 'bolsa rota', 'líquido amniótico', 'contrações regulares',
    'febre', 'dor moderada', 'queda', 'trauma', 'dor de cabeça moderada', 'vómitos incoercíveis'
  ];

  const hasL1 = l1Keywords.some((k) => text.includes(k));
  if (hasL1) {
    return {
      prioridadeSugerida: 'Nível 1 - Vermelho',
      justificativa: 'Sinais sugestivos de emergência obstétrica crítica com risco materno-fetal imediato.',
    };
  }

  const hasL2 = l2Keywords.some((k) => text.includes(k));
  if (hasL2) {
    return {
      prioridadeSugerida: 'Nível 2 - Amarelo',
      justificativa: 'Sinais de alerta obstétrico urgente que requerem avaliação e resposta prioritária.',
    };
  }

  return {
    prioridadeSugerida: 'Nível 3 - Verde',
    justificativa: 'Situação obstétrica estável sem sinais de complicação aguda iminente.',
  };
};

// Check Luanda zone accessibility based on neighborhood
const checkZoneAccessibility = async (bairro, municipio) => {
  const result = await db.query(
    `SELECT id, nome_zona, municipio, classificacao_acesso, descricao_condicoes,
            ponto_encontro_alternativo, latitude_ponto_encontro, longitude_ponto_encontro, bloqueio_ativo
     FROM zonas_vulneraveis
     WHERE LOWER(municipio) = LOWER($1) OR LOWER(nome_zona) LIKE LOWER($2)
     ORDER BY CASE WHEN LOWER(nome_zona) LIKE LOWER($2) THEN 1 ELSE 2 END
     LIMIT 1`,
    [municipio || 'Luanda', `%${bairro}%`]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  return {
    id: null,
    classificacao_acesso: 'Acesso normal',
    descricao_condicoes: 'Acesso viário padrão sem bloqueios cadastrados.',
    ponto_encontro_alternativo: null,
    bloqueio_ativo: false,
  };
};

// Mask sensitive clinical details for privacy compliance
const applyPrivacyFilter = (occurrence, userRole) => {
  if (!occurrence) return null;
  const filtered = { ...occurrence };

  // If user is a citizen (or unauthenticated proxy), strictly hide prenatal clinical notes
  if (userRole === 'cidadao') {
    delete filtered.condicoes_clinicas;
    delete filtered.observacoes_prenatal;
    delete filtered.grupo_sanguineo;
    filtered.clinica_restrita = 'Informações clínicas detalhadas reservadas a profissionais de saúde e equipa de socorro (Lei de Proteção de Dados de Saúde).';
  }

  return filtered;
};

// Generate Protocol Code (e.g. MS-2026-0105)
const generateProtocolCode = async () => {
  const countResult = await db.query('SELECT COUNT(*) FROM ocorrencias');
  const count = parseInt(countResult.rows[0].count, 10) + 1;
  const year = new Date().getFullYear();
  return `MS-${year}-${String(count).padStart(4, '0')}`;
};

module.exports = {
  evaluateObstetricPriority,
  checkZoneAccessibility,
  applyPrivacyFilter,
  generateProtocolCode,
};
