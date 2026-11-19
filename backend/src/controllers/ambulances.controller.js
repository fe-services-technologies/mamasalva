const db = require('../db');
const { simulateMovementStep } = require('../services/ambulanceTrackingService');
const { logAudit } = require('../services/auditService');
const { emitToAll, emitToCentral } = require('../realtime/socketHandler');

const getAmbulances = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT a.*,
              o.id AS ocorrencia_ativa_id,
              o.protocolo_codigo AS ocorrencia_protocolo,
              o.bairro AS ocorrencia_bairro,
              o.prioridade AS ocorrencia_prioridade,
              o.latitude AS destino_lat,
              o.longitude AS destino_lon,
              o.ponto_encontro_coordenadas
       FROM ambulancias a
       LEFT JOIN ocorrencias o ON o.ambulancia_id = a.id AND o.estado_ocorrencia NOT IN ('Recepção Confirmada', 'Concluída', 'Cancelada')
       ORDER BY a.instituicao, a.codigo_identificacao`
    );

    res.json({
      success: true,
      ambulancias: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const getAmbulanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT a.*,
              o.id AS ocorrencia_ativa_id,
              o.protocolo_codigo AS ocorrencia_protocolo,
              o.descricao_sintomas AS ocorrencia_sintomas,
              o.bairro AS ocorrencia_bairro,
              o.rua AS ocorrencia_rua,
              o.ponto_referencia AS ocorrencia_ponto_referencia,
              o.latitude AS ocorrencia_latitude,
              o.longitude AS ocorrencia_longitude,
              o.prioridade AS ocorrencia_prioridade,
              o.classificacao_acesso_local,
              o.ponto_encontro_coordenadas,
              m.nome AS maternidade_destino_nome,
              m.sigla AS maternidade_destino_sigla
       FROM ambulancias a
       LEFT JOIN ocorrencias o ON o.ambulancia_id = a.id AND o.estado_ocorrencia NOT IN ('Recepção Confirmada', 'Concluída', 'Cancelada')
       LEFT JOIN maternidades m ON o.maternidade_destino_id = m.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ambulância não encontrada.' });
    }

    res.json({
      success: true,
      ambulancia: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateAmbulanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado_operacional, latitude_atual, longitude_atual, alerta_falha_comunicacao } = req.body;

    const currentResult = await db.query('SELECT * FROM ambulancias WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ambulância não encontrada.' });
    }
    const current = currentResult.rows[0];

    const fields = [];
    const values = [];
    let idx = 1;

    if (estado_operacional) {
      fields.push(`estado_operacional = $${idx++}`);
      values.push(estado_operacional);
    }
    if (latitude_atual !== undefined && longitude_atual !== undefined) {
      fields.push(`latitude_atual = $${idx++}`, `longitude_atual = $${idx++}`);
      values.push(latitude_atual, longitude_atual);
    }
    if (alerta_falha_comunicacao !== undefined) {
      fields.push(`alerta_falha_comunicacao = $${idx++}`);
      values.push(alerta_falha_comunicacao);
    }

    fields.push(`ultima_comunicacao = CURRENT_TIMESTAMP`, `updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE ambulancias
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);
    const updated = result.rows[0];

    await logAudit({
      usuarioId: req.user ? req.user.id : null,
      usuarioNome: req.user ? req.user.nome : 'Equipa Ambulância',
      perfil: req.user ? req.user.perfil : 'equipa_emergencia',
      acao: 'ATUALIZAR_AMBULANCIA',
      entidade: 'ambulancias',
      entidadeId: id,
      ipOrigem: req.ip,
      dadosAnteriores: { estado: current.estado_operacional },
      dadosNovos: { estado: updated.estado_operacional },
      detalhes: `Estado da viatura ${updated.codigo_identificacao} alterado para ${updated.estado_operacional}`,
    });

    emitToAll('ambulance:status_updated', updated);
    emitToCentral('ambulance:status_updated', updated);

    res.json({
      success: true,
      message: 'Estado da ambulância atualizado com sucesso.',
      ambulancia: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Simular avanço na rota (para demonstração em tempo real)
const simulateMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { target_lat, target_lon, step_fraction = 0.3 } = req.body;

    if (!target_lat || !target_lon) {
      return res.status(400).json({ success: false, message: 'Coordenadas de destino necessárias.' });
    }

    const stepResult = await simulateMovementStep(id, target_lat, target_lon, step_fraction);
    if (!stepResult) {
      return res.status(404).json({ success: false, message: 'Ambulância não encontrada.' });
    }

    res.json({
      success: true,
      data: stepResult,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAmbulances,
  getAmbulanceById,
  updateAmbulanceStatus,
  simulateMovement,
};
