const db = require('../db');
const { logAudit } = require('../services/auditService');
const { emitToAll, emitToCentral } = require('../realtime/socketHandler');

const getZones = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM zonas_vulneraveis
       ORDER BY
         CASE
           WHEN classificacao_acesso = 'Acesso impossível para ambulância convencional' THEN 1
           WHEN classificacao_acesso = 'Acesso condicionado' THEN 2
           ELSE 3
         END,
         municipio, nome_zona`
    );

    res.json({
      success: true,
      zonas: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const getZoneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM zonas_vulneraveis WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zona não encontrada.' });
    }

    res.json({
      success: true,
      zona: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Reportar bloqueio ou condição de via (cidadão ou equipa)
const reportRoadCondition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo_bloqueio, classificacao_sugerida, descricao } = req.body;

    const zoneResult = await db.query('SELECT * FROM zonas_vulneraveis WHERE id = $1', [id]);
    if (zoneResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zona não encontrada.' });
    }
    const zone = zoneResult.rows[0];

    const isOperator = req.user && ['operador', 'supervisor', 'administrador'].includes(req.user.perfil);

    // Se reportado por cidadão, fica pendente de verificação técnica da central
    const result = await db.query(
      `UPDATE zonas_vulneraveis
       SET bloqueio_ativo = true,
           motivo_bloqueio = $1,
           bloqueio_verificado = $2,
           reportado_por = $3,
           descricao_condicoes = COALESCE($4, descricao_condicoes),
           classificacao_acesso = CASE WHEN $2 = true AND $5 IS NOT NULL THEN $5 ELSE classificacao_acesso END,
           data_atualizacao = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        motivo_bloqueio,
        isOperator, // verificado se for operador/supervisor
        req.user ? `${req.user.nome} (${req.user.perfil})` : 'Cidadão via App',
        descricao,
        classificacao_sugerida || null,
        id,
      ]
    );

    const updated = result.rows[0];

    await logAudit({
      usuarioId: req.user ? req.user.id : null,
      usuarioNome: req.user ? req.user.nome : 'Reporte Comunitário',
      perfil: req.user ? req.user.perfil : 'cidadao',
      acao: 'REPORTE_CONDICAO_VIA',
      entidade: 'zonas_vulneraveis',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Alerta de via em ${zone.nome_zona}: ${motivo_bloqueio} (Verificado: ${isOperator})`,
    });

    emitToCentral('zone:road_reported', updated);

    res.json({
      success: true,
      message: isOperator
        ? 'Estado da via atualizado e verificado com sucesso.'
        : 'Condição da via comunicada. Aguarda verificação técnica da Central de Coordenação.',
      zona: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Verificação oficial por operador/supervisor
const verifyRoadCondition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { classificacao_acesso, bloqueio_ativo, motivo_bloqueio, ponto_encontro_alternativo } = req.body;

    const result = await db.query(
      `UPDATE zonas_vulneraveis
       SET classificacao_acesso = COALESCE($1, classificacao_acesso),
           bloqueio_ativo = COALESCE($2, bloqueio_ativo),
           motivo_bloqueio = $3,
           ponto_encontro_alternativo = COALESCE($4, ponto_encontro_alternativo),
           bloqueio_verificado = true,
           data_atualizacao = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [classificacao_acesso, bloqueio_ativo, motivo_bloqueio, ponto_encontro_alternativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Zona não encontrada.' });
    }

    emitToAll('zone:updated', result.rows[0]);

    res.json({
      success: true,
      message: 'Condições da via verificadas e validadas oficialmente.',
      zona: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getZones,
  getZoneById,
  reportRoadCondition,
  verifyRoadCondition,
};
