const db = require('../db');
const { logAudit } = require('../services/auditService');
const { emitToAll, emitToCentral } = require('../realtime/socketHandler');

const getMaternities = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM ocorrencias o
               WHERE o.maternidade_destino_id = m.id
                 AND o.estado_ocorrencia IN ('Ambulância a Caminho', 'Equipa no Local', 'Em Transporte para Maternidade', 'Chegada à Maternidade')
              ) AS chegadas_iminentes
       FROM maternidades m
       ORDER BY m.municipio, m.nome`
    );

    res.json({
      success: true,
      maternidades: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const getMaternityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM maternidades WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maternidade não encontrada.' });
    }

    // Buscar transferências ativas
    const ocorrenciasResult = await db.query(
      `SELECT o.*, g.nome_completo AS gravida_nome, g.semanas_gestacao, g.condicoes_clinicas, g.grupo_sanguineo,
              a.codigo_identificacao AS ambulancia_codigo
       FROM ocorrencias o
       LEFT JOIN gravidas g ON o.gravida_id = g.id
       LEFT JOIN ambulancias a ON o.ambulancia_id = a.id
       WHERE o.maternidade_destino_id = $1
         AND o.estado_ocorrencia NOT IN ('Cancelada')
       ORDER BY o.tempo_inicio DESC`,
      [id]
    );

    res.json({
      success: true,
      maternidade: result.rows[0],
      ocorrencias_vinculadas: ocorrenciasResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

const updateMaternityCapacity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      estado_funcionamento,
      camas_obstetricas_livres,
      salas_parto_ativas,
      bloco_operatorio_disponivel,
      neonatologia_ativa,
      equipa_obstetrica_plantao,
      observacoes_capacidade,
    } = req.body;

    const currentResult = await db.query('SELECT * FROM maternidades WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maternidade não encontrada.' });
    }
    const current = currentResult.rows[0];

    const fields = [];
    const values = [];
    let idx = 1;

    if (estado_funcionamento !== undefined) {
      fields.push(`estado_funcionamento = $${idx++}`);
      values.push(estado_funcionamento);
    }
    if (camas_obstetricas_livres !== undefined) {
      fields.push(`camas_obstetricas_livres = $${idx++}`);
      values.push(camas_obstetricas_livres);
    }
    if (salas_parto_ativas !== undefined) {
      fields.push(`salas_parto_ativas = $${idx++}`);
      values.push(salas_parto_ativas);
    }
    if (bloco_operatorio_disponivel !== undefined) {
      fields.push(`bloco_operatorio_disponivel = $${idx++}`);
      values.push(bloco_operatorio_disponivel);
    }
    if (neonatologia_ativa !== undefined) {
      fields.push(`neonatologia_ativa = $${idx++}`);
      values.push(neonatologia_ativa);
    }
    if (equipa_obstetrica_plantao !== undefined) {
      fields.push(`equipa_obstetrica_plantao = $${idx++}`);
      values.push(equipa_obstetrica_plantao);
    }
    if (observacoes_capacidade !== undefined) {
      fields.push(`observacoes_capacidade = $${idx++}`);
      values.push(observacoes_capacidade);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE maternidades
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);
    const updated = result.rows[0];

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'ATUALIZAR_CAPACIDADE_MATERNIDADE',
      entidade: 'maternidades',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Capacidade de ${updated.nome} atualizada: ${updated.camas_obstetricas_livres} camas livres, estado: ${updated.estado_funcionamento}`,
    });

    emitToAll('maternity:capacity_updated', updated);
    emitToCentral('maternity:capacity_updated', updated);

    res.json({
      success: true,
      message: 'Capacidade operacional da maternidade atualizada com sucesso.',
      maternidade: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMaternities,
  getMaternityById,
  updateMaternityCapacity,
};
