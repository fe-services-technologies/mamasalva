const db = require('../db');
const {
  evaluateObstetricPriority,
  checkZoneAccessibility,
  applyPrivacyFilter,
  generateProtocolCode,
} = require('../services/occurrenceService');
const { logAudit } = require('../services/auditService');
const {
  emitToAll,
  emitToCentral,
  emitToOccurrence,
  emitToRole,
  emitToUser,
} = require('../realtime/socketHandler');

// 1. Criar Ocorrência (Suporta os 5 canais)
const createOccurrence = async (req, res, next) => {
  try {
    const {
      canal_entrada = 'App Grávida',
      numero_processo,
      gravida_id: directGravidaId,
      solicitante_nome,
      solicitante_telefone,
      tipo_solicitante = 'propria_gravida',
      relacao_gravida = 'Própria',
      gravida_cadastrada = true,
      descricao_sintomas,
      sinais_alerta = [],
      municipio = 'Luanda',
      bairro,
      rua,
      ponto_referencia,
      latitude,
      longitude,
      origem_coordenadas = 'GPS Automático',
    } = req.body;

    if (!solicitante_nome || !solicitante_telefone || !descricao_sintomas || !bairro || !ponto_referencia) {
      return res.status(400).json({
        success: false,
        message: 'Preencha todos os campos obrigatórios (nome, telefone, sintomas, bairro e ponto de referência).',
      });
    }

    // Identificar gestante se cadastrada
    let resolvedGravidaId = directGravidaId || null;
    let resolvedGravida = null;

    if (numero_processo) {
      const gResult = await db.query('SELECT * FROM gravidas WHERE numero_processo = $1', [numero_processo.trim()]);
      if (gResult.rows.length > 0) {
        resolvedGravida = gResult.rows[0];
        resolvedGravidaId = resolvedGravida.id;
      }
    } else if (req.user && req.user.perfil === 'gravida') {
      const gResult = await db.query('SELECT * FROM gravidas WHERE user_id = $1', [req.user.id]);
      if (gResult.rows.length > 0) {
        resolvedGravida = gResult.rows[0];
        resolvedGravidaId = resolvedGravida.id;
      }
    }

    const protocolo_codigo = await generateProtocolCode();

    // Avaliação de triagem clínica preliminar pelo protocolo
    const triagemPreliminar = evaluateObstetricPriority(sinais_alerta, descricao_sintomas);

    // Avaliação de condições viárias do bairro em Luanda
    const zonaInfo = await checkZoneAccessibility(bairro, municipio);

    const isAcessoImpossivel = zonaInfo.classificacao_acesso === 'Acesso impossível para ambulância convencional';
    const alertaSupervisor = isAcessoImpossivel;
    const motivoAlerta = isAcessoImpossivel
      ? `Acesso viário classificado como impossível para viatura convencional no bairro ${bairro}. Definido ponto de encontro alternativo: ${zonaInfo.ponto_encontro_alternativo || 'A designar'}.`
      : null;

    const pontoEncontro = zonaInfo.ponto_encontro_alternativo
      ? `${zonaInfo.ponto_encontro_alternativo} (Lat: ${zonaInfo.latitude_ponto_encontro || ''}, Lon: ${zonaInfo.longitude_ponto_encontro || ''})`
      : null;

    // Coordenadas finais: se não fornecidas por GPS/mapa, adotar centro da zona
    const finalLat = latitude || (resolvedGravida ? resolvedGravida.latitude_residencia : null) || zonaInfo.latitude || -8.8383;
    const finalLon = longitude || (resolvedGravida ? resolvedGravida.longitude_residencia : null) || zonaInfo.longitude || 13.2344;

    const query = `
      INSERT INTO ocorrencias (
        protocolo_codigo, canal_entrada, gravida_id, solicitante_nome, solicitante_telefone,
        tipo_solicitante, relacao_gravida, gravida_cadastrada, descricao_sintomas, sinais_alerta,
        prioridade, justificativa_prioridade, municipio, bairro, rua, ponto_referencia,
        latitude, longitude, origem_coordenadas, zona_vulneravel_id, classificacao_acesso_local,
        ponto_encontro_coordenadas, etapa_atual, estado_ocorrencia, alerta_supervisor_ativo,
        motivo_alerta_supervisor, tempo_inicio
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP
      ) RETURNING *;
    `;

    const values = [
      protocolo_codigo,
      canal_entrada,
      resolvedGravidaId,
      solicitante_nome,
      solicitante_telefone,
      tipo_solicitante,
      relacao_gravida,
      gravida_cadastrada,
      descricao_sintomas,
      sinais_alerta,
      triagemPreliminar.prioridadeSugerida,
      `Sugestão preliminar do protocolo de triagem: ${triagemPreliminar.justificativa} (Aguardando validação do operador)`,
      municipio,
      bairro,
      rua || 'Não especificada',
      ponto_referencia,
      finalLat,
      finalLon,
      origem_coordenadas,
      zonaInfo.id || null,
      zonaInfo.classificacao_acesso,
      pontoEncontro,
      2, // Etapa 2: Registo da Ocorrência
      'Nova',
      alertaSupervisor,
      motivoAlerta,
    ];

    const result = await db.query(query, values);
    const novaOcorrencia = result.rows[0];

    // Registrar histórico do ciclo
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        novaOcorrencia.id,
        2,
        null,
        'Nova',
        req.user ? req.user.id : null,
        `Ocorrência registada via canal '${canal_entrada}'.`,
        JSON.stringify({ canal_entrada, prioridade_sugerida: triagemPreliminar.prioridadeSugerida, classificacao_acesso: zonaInfo.classificacao_acesso }),
      ]
    );

    // Registro de SMS informativo para solicitante
    const smsContent = `MATERNITY SOS: O seu pedido de emergência ${protocolo_codigo} foi registado. A Central 114 de Luanda está a avaliar a sua prioridade. Mantenha a linha livre.`;
    await db.query(
      `INSERT INTO mensagens_sms_ussd (ocorrencia_id, telefone_destino, tipo, conteudo)
       VALUES ($1, $2, 'SMS_ENVIADO', $3)`,
      [novaOcorrencia.id, solicitante_telefone, smsContent]
    );

    // Auditoria
    await logAudit({
      usuarioId: req.user ? req.user.id : null,
      usuarioNome: req.user ? req.user.nome : solicitante_nome,
      perfil: req.user ? req.user.perfil : 'solicitante',
      acao: 'CRIAR_OCORRENCIA',
      entidade: 'ocorrencias',
      entidadeId: novaOcorrencia.id,
      ipOrigem: req.ip,
      detalhes: `Nova emergência gerada: ${protocolo_codigo} em ${bairro}, Luanda. Prioridade preliminar: ${triagemPreliminar.prioridadeSugerida}`,
    });

    // Notificar central em tempo real via Socket.IO
    emitToCentral('occurrence:created', novaOcorrencia);
    if (alertaSupervisor) {
      emitToRole('supervisor', 'supervisor:alert', {
        tipo: 'ZONA_DIFICIL_ACESSO',
        ocorrenciaId: novaOcorrencia.id,
        protocolo_codigo,
        bairro,
        motivo: motivoAlerta,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Emergência registada com sucesso.',
      ocorrencia: novaOcorrencia,
    });
  } catch (err) {
    next(err);
  }
};

// 2. Listar Ocorrências (Com RBAC e filtro estrito de privacidade clínica)
const getOccurrences = async (req, res, next) => {
  try {
    const user = req.user;
    let query = `
      SELECT o.*,
             g.nome_completo AS gravida_nome,
             g.numero_processo AS gravida_processo,
             g.idade AS gravida_idade,
             g.semanas_gestacao AS gravida_semanas,
             g.condicoes_clinicas,
             g.observacoes_prenatal,
             g.grupo_sanguineo,
             a.codigo_identificacao AS ambulancia_codigo,
             a.instituicao AS ambulancia_instituicao,
             a.estado_operacional AS ambulancia_estado,
             m.nome AS maternidade_nome,
             m.sigla AS maternidade_sigla,
             u_op.nome AS operador_nome
      FROM ocorrencias o
      LEFT JOIN gravidas g ON o.gravida_id = g.id
      LEFT JOIN ambulancias a ON o.ambulancia_id = a.id
      LEFT JOIN maternidades m ON o.maternidade_destino_id = m.id
      LEFT JOIN users u_op ON o.operador_atribuido_id = u_op.id
    `;
    const params = [];

    // Regras de visualização por perfil
    if (user.perfil === 'gravida') {
      query += ` WHERE (o.gravida_id IN (SELECT id FROM gravidas WHERE user_id = $1) OR o.solicitante_telefone = $2)`;
      params.push(user.id, user.telefone);
    } else if (user.perfil === 'cidadao') {
      // Cidadão só vê ocorrências que ele próprio solicitou
      query += ` WHERE o.solicitante_telefone = $1`;
      params.push(user.telefone);
    } else if (user.perfil === 'equipa_emergencia') {
      // Equipe vê apenas ocorrências da sua ambulância
      query += ` WHERE o.ambulancia_id IN (SELECT id FROM ambulancias WHERE user_id = $1)`;
      params.push(user.id);
    } else if (user.perfil === 'maternidade') {
      // Maternidade vê ocorrências direcionadas a ela
      query += ` WHERE o.maternidade_destino_id IN (SELECT id FROM maternidades WHERE user_id = $1)`;
      params.push(user.id);
    }
    // 'operador', 'supervisor', 'administrador' veem tudo

    query += ` ORDER BY
      CASE
        WHEN o.prioridade = 'Nível 1 - Vermelho' THEN 1
        WHEN o.prioridade = 'Nível 2 - Amarelo' THEN 2
        WHEN o.prioridade = 'Nível 3 - Verde' THEN 3
        ELSE 4
      END,
      o.tempo_inicio DESC`;

    const result = await db.query(query, params);

    // Aplicação estrita de privacidade clínica (se cidadão)
    const sanitizedRows = result.rows.map((row) => applyPrivacyFilter(row, user.perfil));

    res.json({
      success: true,
      total: sanitizedRows.length,
      ocorrencias: sanitizedRows,
    });
  } catch (err) {
    next(err);
  }
};

// 3. Obter Detalhes da Ocorrência por ID (com histórico do ciclo)
const getOccurrenceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await db.query(
      `SELECT o.*,
              g.nome_completo AS gravida_nome,
              g.numero_processo AS gravida_processo,
              g.idade AS gravida_idade,
              g.semanas_gestacao AS gravida_semanas,
              g.condicoes_clinicas,
              g.observacoes_prenatal,
              g.grupo_sanguineo,
              g.telefone_contato AS gravida_telefone,
              a.codigo_identificacao AS ambulancia_codigo,
              a.instituicao AS ambulancia_instituicao,
              a.estado_operacional AS ambulancia_estado,
              a.latitude_atual AS ambulancia_lat,
              a.longitude_atual AS ambulancia_lon,
              a.equipa_responsavel AS ambulancia_equipa,
              a.contato_radio_telefone AS ambulancia_contato,
              m.nome AS maternidade_nome,
              m.sigla AS maternidade_sigla,
              m.telefone_emergencia AS maternidade_telefone,
              m.camas_obstetricas_livres,
              m.bloco_operatorio_disponivel,
              m.neonatologia_ativa,
              u_op.nome AS operador_nome
       FROM ocorrencias o
       LEFT JOIN gravidas g ON o.gravida_id = g.id
       LEFT JOIN ambulancias a ON o.ambulancia_id = a.id
       LEFT JOIN maternidades m ON o.maternidade_destino_id = m.id
       LEFT JOIN users u_op ON o.operador_atribuido_id = u_op.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }

    const row = result.rows[0];

    // Buscar histórico de transições de estado
    const histResult = await db.query(
      `SELECT h.*, u.nome AS usuario_nome, u.perfil AS usuario_perfil
       FROM ocorrencia_historico_estados h
       LEFT JOIN users u ON h.atualizado_por_usuario_id = u.id
       WHERE h.ocorrencia_id = $1
       ORDER BY h.created_at ASC`,
      [id]
    );

    // Buscar SMS relacionados
    const smsResult = await db.query(
      `SELECT * FROM mensagens_sms_ussd WHERE ocorrencia_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const filtered = applyPrivacyFilter(row, user.perfil);

    res.json({
      success: true,
      ocorrencia: {
        ...filtered,
        historico_estados: histResult.rows,
        mensagens_sms: smsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 4. Etapa 3: Análise e Prioridade (Triagem validada por profissional/operador)
const validateTriage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prioridade, justificativa_prioridade } = req.body;

    if (!prioridade || !justificativa_prioridade) {
      return res.status(400).json({
        success: false,
        message: 'A prioridade (Nível 1, 2 ou 3) e a fundamentação clínica da triagem são obrigatórias.',
      });
    }

    const currentResult = await db.query('SELECT * FROM ocorrencias WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }
    const current = currentResult.rows[0];

    const updateResult = await db.query(
      `UPDATE ocorrencias
       SET prioridade = $1,
           justificativa_prioridade = $2,
           triagem_validada_por = $3,
           triagem_data = CURRENT_TIMESTAMP,
           etapa_atual = 3,
           estado_ocorrencia = 'Aguardando Despacho',
           tempo_primeira_resposta = COALESCE(tempo_primeira_resposta, CURRENT_TIMESTAMP),
           operador_atribuido_id = COALESCE(operador_atribuido_id, $3),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [prioridade, justificativa_prioridade, req.user.id, id]
    );

    const updated = updateResult.rows[0];

    // Registrar histórico
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, 3, $2, 'Aguardando Despacho', $3, $4, $5)`,
      [
        id,
        current.estado_ocorrencia,
        req.user.id,
        `Triagem clínica validada: ${prioridade}. ${justificativa_prioridade}`,
        JSON.stringify({ prioridade, justificativa_prioridade }),
      ]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'VALIDAR_TRIAGEM',
      entidade: 'ocorrencias',
      entidadeId: id,
      ipOrigem: req.ip,
      dadosAnteriores: { prioridade: current.prioridade, estado: current.estado_ocorrencia },
      dadosNovos: { prioridade: updated.prioridade, estado: updated.estado_ocorrencia },
      detalhes: `Triagem validada como ${prioridade} para ocorrência ${updated.protocolo_codigo}`,
    });

    emitToOccurrence(id, 'occurrence:triaged', updated);
    emitToCentral('occurrence:triaged', updated);

    res.json({
      success: true,
      message: 'Triagem validada com sucesso pelo operador.',
      ocorrencia: updated,
    });
  } catch (err) {
    next(err);
  }
};

// 5. Etapa 4: Coordenação do Socorro (Atribuir e despachar ambulância)
const dispatchAmbulance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ambulancia_id } = req.body;

    if (!ambulancia_id) {
      return res.status(400).json({ success: false, message: 'Selecione uma ambulância para despacho.' });
    }

    const ocResult = await db.query('SELECT * FROM ocorrencias WHERE id = $1', [id]);
    if (ocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }
    const ocorrencia = ocResult.rows[0];

    const ambResult = await db.query('SELECT * FROM ambulancias WHERE id = $1', [ambulancia_id]);
    if (ambResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ambulância não encontrada.' });
    }
    const ambulancia = ambResult.rows[0];

    // Atualizar ocorrência
    const updatedOc = await db.query(
      `UPDATE ocorrencias
       SET ambulancia_id = $1,
           etapa_atual = 4,
           estado_ocorrencia = 'Ambulância a Caminho',
           tempo_atribuicao_equipa = CURRENT_TIMESTAMP,
           operador_atribuido_id = COALESCE(operador_atribuido_id, $2),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [ambulancia_id, req.user.id, id]
    );

    // Atualizar estado da ambulância
    await db.query(
      `UPDATE ambulancias
       SET estado_operacional = 'A caminho da ocorrência',
           ultima_comunicacao = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [ambulancia_id]
    );

    // Histórico de transição
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, 4, $2, 'Ambulância a Caminho', $3, $4, $5)`,
      [
        id,
        ocorrencia.estado_ocorrencia,
        req.user.id,
        `Ambulância ${ambulancia.codigo_identificacao} (${ambulancia.instituicao}) despachada para o local.`,
        JSON.stringify({ ambulancia: ambulancia.codigo_identificacao, equipa: ambulancia.equipa_responsavel }),
      ]
    );

    // SMS de aviso à solicitante
    const sms = `MATERNITY SOS: A ambulância ${ambulancia.codigo_identificacao} está a caminho de ${ocorrencia.bairro}. Contacto da equipa de resgate: ${ambulancia.contato_radio_telefone}.`;
    await db.query(
      `INSERT INTO mensagens_sms_ussd (ocorrencia_id, telefone_destino, tipo, conteudo)
       VALUES ($1, $2, 'SMS_ENVIADO', $3)`,
      [id, ocorrencia.solicitante_telefone, sms]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'DESPACHO_AMBULANCIA',
      entidade: 'ocorrencias',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Despachada ambulância ${ambulancia.codigo_identificacao} para ocorrência ${ocorrencia.protocolo_codigo}`,
    });

    emitToOccurrence(id, 'occurrence:ambulance_assigned', {
      ocorrencia: updatedOc.rows[0],
      ambulancia,
    });
    emitToCentral('occurrence:ambulance_assigned', {
      ocorrencia: updatedOc.rows[0],
      ambulancia,
    });

    res.json({
      success: true,
      message: `Ambulância ${ambulancia.codigo_identificacao} despachada com sucesso.`,
      ocorrencia: updatedOc.rows[0],
      ambulancia,
    });
  } catch (err) {
    next(err);
  }
};

// 6. Etapa 5: Encaminhamento (Coordenação com maternidade e aviso prévio)
const referToMaternity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { maternidade_id, observacoes_encaminhamento } = req.body;

    if (!maternidade_id) {
      return res.status(400).json({ success: false, message: 'Selecione a maternidade de destino.' });
    }

    const ocResult = await db.query('SELECT * FROM ocorrencias WHERE id = $1', [id]);
    if (ocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }
    const ocorrencia = ocResult.rows[0];

    const matResult = await db.query('SELECT * FROM maternidades WHERE id = $1', [maternidade_id]);
    if (matResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maternidade não encontrada.' });
    }
    const maternidade = matResult.rows[0];

    const updatedResult = await db.query(
      `UPDATE ocorrencias
       SET maternidade_destino_id = $1,
           maternidade_comunicada = true,
           maternidade_comunicada_em = CURRENT_TIMESTAMP,
           etapa_atual = 5,
           observacoes_gerais = COALESCE(observacoes_gerais || E'\n', '') || $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        maternidade_id,
        `[Encaminhamento]: Maternidade ${maternidade.sigla} comunicada previamente. ${observacoes_encaminhamento || ''}`,
        id,
      ]
    );

    // Histórico de transição
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, 5, $2, $3, $4, $5, $6)`,
      [
        id,
        ocorrencia.estado_ocorrencia,
        ocorrencia.estado_ocorrencia,
        req.user.id,
        `Encaminhamento obstétrico comunicado à ${maternidade.nome} (${maternidade.sigla}).`,
        JSON.stringify({ maternidade: maternidade.nome, camas_livres: maternidade.camas_obstetricas_livres }),
      ]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'ENCAMINHAMENTO_MATERNIDADE',
      entidade: 'ocorrencias',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Ocorrência ${ocorrencia.protocolo_codigo} encaminhada para ${maternidade.nome}`,
    });

    emitToOccurrence(id, 'occurrence:maternity_notified', {
      ocorrencia: updatedResult.rows[0],
      maternidade,
    });
    emitToRole('maternidade', 'occurrence:maternity_notified', {
      ocorrencia: updatedResult.rows[0],
      maternidade,
    });

    res.json({
      success: true,
      message: `Comunicação prévia enviada à ${maternidade.nome}.`,
      ocorrencia: updatedResult.rows[0],
      maternidade,
    });
  } catch (err) {
    next(err);
  }
};

// 7. Etapa 4/5/6: Atualizar Estado Operacional (Equipa no local, Transporte, Chegada)
const updateOperationalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { novo_estado, observacao } = req.body;

    const validStates = [
      'Equipa no Local',
      'Em Transporte para Maternidade',
      'Chegada à Maternidade',
    ];

    if (!validStates.includes(novo_estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores aceites: ${validStates.join(', ')}`,
      });
    }

    const ocResult = await db.query('SELECT * FROM ocorrencias WHERE id = $1', [id]);
    if (ocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }
    const oc = ocResult.rows[0];

    let etapa = oc.etapa_atual;
    let ambState = null;
    let updateFields = '';
    const params = [novo_estado, id];

    if (novo_estado === 'Equipa no Local') {
      etapa = 4;
      ambState = 'No local';
      updateFields = ', tempo_chegada_local = COALESCE(tempo_chegada_local, CURRENT_TIMESTAMP)';
    } else if (novo_estado === 'Em Transporte para Maternidade') {
      etapa = 5;
      ambState = 'Em transporte';
    } else if (novo_estado === 'Chegada à Maternidade') {
      etapa = 5;
      ambState = 'No local';
    }

    const updateQuery = `
      UPDATE ocorrencias
      SET estado_ocorrencia = $1,
          etapa_atual = ${etapa}
          ${updateFields},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const updated = await db.query(updateQuery, params);

    // Se houver ambulância vinculada, sincronizar seu estado operacional
    if (oc.ambulancia_id && ambState) {
      await db.query(
        'UPDATE ambulancias SET estado_operacional = $1, ultima_comunicacao = CURRENT_TIMESTAMP WHERE id = $2',
        [ambState, oc.ambulancia_id]
      );
    }

    // Histórico de auditoria do ciclo
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        etapa,
        oc.estado_ocorrencia,
        novo_estado,
        req.user.id,
        observacao || `Estado operacional alterado para: ${novo_estado}`,
        JSON.stringify({ estado_operacional_ambulancia: ambState }),
      ]
    );

    emitToOccurrence(id, 'occurrence:updated', updated.rows[0]);
    emitToCentral('occurrence:updated', updated.rows[0]);

    res.json({
      success: true,
      message: `Estado atualizado para '${novo_estado}'.`,
      ocorrencia: updated.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// 8. Etapa 6: Acompanhamento e Confirmação de Recepção pela Maternidade
const confirmReception = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { responsavel_recepcao, observacoes_admissao } = req.body;

    const ocResult = await db.query('SELECT * FROM ocorrencias WHERE id = $1', [id]);
    if (ocResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }
    const oc = ocResult.rows[0];

    const nomeResponsavel = responsavel_recepcao || (req.user ? req.user.nome : 'Equipa Obstétrica de Admissão');

    const updateResult = await db.query(
      `UPDATE ocorrencias
       SET maternidade_confirmou_recepcao = true,
           maternidade_confirmacao_em = CURRENT_TIMESTAMP,
           maternidade_responsavel_recepcao = $1,
           etapa_atual = 6,
           estado_ocorrencia = 'Recepção Confirmada',
           tempo_conclusao = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [nomeResponsavel, id]
    );

    // Liberar ambulância vinculada
    if (oc.ambulancia_id) {
      await db.query(
        "UPDATE ambulancias SET estado_operacional = 'Livre', ultima_comunicacao = CURRENT_TIMESTAMP WHERE id = $1",
        [oc.ambulancia_id]
      );
    }

    // Histórico de ciclo concluído
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, 6, $2, 'Recepção Confirmada', $3, $4, $5)`,
      [
        id,
        oc.estado_ocorrencia,
        req.user.id,
        `Recepção formal confirmada na unidade hospitalar por: ${nomeResponsavel}. Ocorrência concluída com sucesso.`,
        JSON.stringify({ responsavel: nomeResponsavel, observacoes_admissao }),
      ]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'CONFIRMAR_RECEPCAO',
      entidade: 'ocorrencias',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Recepção confirmada na maternidade para ${oc.protocolo_codigo}. Viatura desmobilizada.`,
    });

    emitToOccurrence(id, 'occurrence:reception_confirmed', updateResult.rows[0]);
    emitToCentral('occurrence:reception_confirmed', updateResult.rows[0]);

    res.json({
      success: true,
      message: 'Recepção da grávida confirmada na maternidade. Ciclo de emergência concluído.',
      ocorrencia: updateResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// 9. Contingência: Sinalizar Pedido Suspeito (Trote) para Revisão Humana
const flagSuspicious = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo_suspeita } = req.body;

    if (!motivo_suspeita) {
      return res.status(400).json({ success: false, message: 'Indique o motivo da suspeita.' });
    }

    const result = await db.query(
      `UPDATE ocorrencias
       SET is_suspeita_trote = true,
           motivo_suspeita = $1,
           estado_ocorrencia = 'Sob Revisão de Suspeita',
           alerta_supervisor_ativo = true,
           motivo_alerta_supervisor = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        motivo_suspeita,
        `Pedido sob análise humana por suspeita de inconsistência: ${motivo_suspeita}`,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ocorrência não encontrada.' });
    }

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'SINALIZAR_SUSPEITA',
      entidade: 'ocorrencias',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Ocorrência colocada sob revisão humana do supervisor: ${motivo_suspeita}`,
    });

    emitToRole('supervisor', 'supervisor:alert', {
      tipo: 'PEDIDO_SUSPEITO',
      ocorrenciaId: id,
      motivo: motivo_suspeita,
    });

    res.json({
      success: true,
      message: 'Ocorrência encaminhada para fila de revisão humana do supervisor.',
      ocorrencia: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// 10. Contingência: Revisão Humana de Pedido Suspeito pelo Supervisor
const reviewSuspicious = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parecer_supervisor, acao } = req.body; // acao: 'MANTER_VALIDA' ou 'CANCELAR_TROTE'

    if (!parecer_supervisor || !acao) {
      return res.status(400).json({ success: false, message: 'Informe o parecer técnico e a decisão.' });
    }

    let novoEstado = acao === 'MANTER_VALIDA' ? 'Aguardando Despacho' : 'Cancelada';

    const result = await db.query(
      `UPDATE ocorrencias
       SET revisao_supervisor_feita = true,
           parecer_supervisor = $1,
           estado_ocorrencia = $2,
           alerta_supervisor_ativo = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [parecer_supervisor, novoEstado, id]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'REVISAO_SUPERVISOR_PEDIDO',
      entidade: 'ocorrencias',
      entidadeId: id,
      ipOrigem: req.ip,
      detalhes: `Supervisor avaliou ocorrência. Decisão: ${acao}. Parecer: ${parecer_supervisor}`,
    });

    emitToCentral('occurrence:updated', result.rows[0]);

    res.json({
      success: true,
      message: `Revisão de supervisão concluída com decisão: ${acao}.`,
      ocorrencia: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOccurrence,
  getOccurrences,
  getOccurrenceById,
  validateTriage,
  dispatchAmbulance,
  referToMaternity,
  updateOperationalStatus,
  confirmReception,
  flagSuspicious,
  reviewSuspicious,
};
