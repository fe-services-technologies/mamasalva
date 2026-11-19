const db = require('../db');

const getDashboardKPIs = async (req, res, next) => {
  try {
    // 1. Total e distribuição por estado
    const countsResult = await db.query(`
      SELECT
        COUNT(*) AS total_ocorrencias,
        COUNT(*) FILTER (WHERE estado_ocorrencia NOT IN ('Concluída', 'Recepção Confirmada', 'Cancelada')) AS ativas,
        COUNT(*) FILTER (WHERE prioridade = 'Nível 1 - Vermelho' AND estado_ocorrencia NOT IN ('Concluída', 'Recepção Confirmada', 'Cancelada')) AS ativas_nivel_1,
        COUNT(*) FILTER (WHERE prioridade = 'Nível 2 - Amarelo' AND estado_ocorrencia NOT IN ('Concluída', 'Recepção Confirmada', 'Cancelada')) AS ativas_nivel_2,
        COUNT(*) FILTER (WHERE prioridade = 'Nível 3 - Verde' AND estado_ocorrencia NOT IN ('Concluída', 'Recepção Confirmada', 'Cancelada')) AS ativas_nivel_3,
        COUNT(*) FILTER (WHERE prioridade = 'Pendente') AS pendentes_triagem,
        COUNT(*) FILTER (WHERE maternidade_confirmou_recepcao = true) AS recepcao_confirmada,
        COUNT(*) FILTER (WHERE classificacao_acesso_local = 'Acesso impossível para ambulância convencional') AS zona_dificil_acesso,
        COUNT(*) FILTER (WHERE alerta_supervisor_ativo = true) AS alertas_supervisor_ativos,
        COUNT(*) FILTER (WHERE is_suspeita_trote = true) AS pedidos_suspeitos
      FROM ocorrencias;
    `);

    // 2. Ambulâncias disponíveis vs em missão
    const ambCounts = await db.query(`
      SELECT
        COUNT(*) AS total_ambulancias,
        COUNT(*) FILTER (WHERE estado_operacional = 'Livre') AS livres,
        COUNT(*) FILTER (WHERE estado_operacional IN ('A caminho da ocorrência', 'No local', 'Em transporte')) AS ocupadas,
        COUNT(*) FILTER (WHERE estado_operacional = 'Indisponível') AS indisponiveis,
        COUNT(*) FILTER (WHERE alerta_falha_comunicacao = true) AS falhas_comunicacao
      FROM ambulancias;
    `);

    // 3. Maternidades com camas livres totais
    const matCounts = await db.query(`
      SELECT
        COUNT(*) AS total_maternidades,
        COALESCE(SUM(camas_obstetricas_livres), 0) AS camas_obstetricas_totais_livres,
        COUNT(*) FILTER (WHERE estado_funcionamento = 'Sobrecarga') AS em_sobrecarga
      FROM maternidades;
    `);

    // 4. Médias de tempo operacional (em minutos)
    const timeAverages = await db.query(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (tempo_primeira_resposta - tempo_inicio)) / 60)::numeric, 1) AS media_minutos_primeira_resposta,
        ROUND(AVG(EXTRACT(EPOCH FROM (tempo_atribuicao_equipa - tempo_inicio)) / 60)::numeric, 1) AS media_minutos_atribuicao_equipa,
        ROUND(AVG(EXTRACT(EPOCH FROM (tempo_conclusao - tempo_inicio)) / 60)::numeric, 1) AS media_minutos_ciclo_completo
      FROM ocorrencias
      WHERE tempo_primeira_resposta IS NOT NULL;
    `);

    // 5. Percentual de ocorrências com geolocalização identificada
    const geoPerc = await db.query(`
      SELECT
        ROUND((COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100), 1) AS perc_geolocalizacao_identificada
      FROM ocorrencias;
    `);

    // 6. Distribuição por canal de entrada
    const canaisResult = await db.query(`
      SELECT canal_entrada, COUNT(*) AS total
      FROM ocorrencias
      GROUP BY canal_entrada
      ORDER BY total DESC;
    `);

    // 7. Distribuição por município de Luanda
    const municipiosResult = await db.query(`
      SELECT municipio, COUNT(*) AS total
      FROM ocorrencias
      GROUP BY municipio
      ORDER BY total DESC;
    `);

    res.json({
      success: true,
      kpis: {
        ocorrencias: countsResult.rows[0],
        ambulancias: ambCounts.rows[0],
        maternidades: matCounts.rows[0],
        tempos_medios_minutos: timeAverages.rows[0],
        geolocalizacao: geoPerc.rows[0],
        distribuicao_canais: canaisResult.rows,
        distribuicao_municipios: municipiosResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Obter logs de auditoria
const getAuditLogs = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 100`
    );

    res.json({
      success: true,
      logs: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardKPIs,
  getAuditLogs,
};
