const db = require('../db');
const { generateProtocolCode, evaluateObstetricPriority, checkZoneAccessibility } = require('../services/occurrenceService');
const { emitToCentral } = require('../realtime/socketHandler');
const { logAudit } = require('../services/auditService');

// Sessões USSD em memória para o simulador
const ussdSessions = new Map();

const handleUssdSession = async (req, res, next) => {
  try {
    const { sessionId = 'sess_default', phoneNumber = '+244923000114', text = '' } = req.body;

    const trimmedText = text.trim();
    let session = ussdSessions.get(sessionId) || { step: 'ROOT', data: {} };

    let responseMessage = '';
    let isEnd = false;

    // Se o utilizador acabou de discar *114# ou resetou
    if (trimmedText === '*114#' || trimmedText === '') {
      session = { step: 'ROOT', data: {} };
      ussdSessions.set(sessionId, session);

      responseMessage =
        'MATERNITY SOS Luanda (*114#)\n' +
        '1. Estou grávida e preciso de ajuda\n' +
        '2. Pedir ajuda para outra grávida\n' +
        '3. Grávida não cadastrada — Emergência\n' +
        '4. Sair';

      return res.json({ message: responseMessage, isEnd: false, sessionStep: session.step });
    }

    // Máquina de estados USSD
    if (session.step === 'ROOT') {
      if (trimmedText === '1') {
        session.step = 'GRAVIDA_SINTOMAS';
        session.data.canal = 'USSD *114#';
        session.data.tipo_solicitante = 'propria_gravida';
        responseMessage =
          'O que está a sentir?\n' +
          '1. Dor forte / Sangramento\n' +
          '2. Bolsa rota / Água a sair\n' +
          '3. Dor de cabeça forte / Visão turva\n' +
          '4. Outros sintomas urgentes';
      } else if (trimmedText === '2') {
        session.step = 'OUTRA_PROCESSO';
        session.data.canal = 'USSD *114#';
        session.data.tipo_solicitante = 'cidadao_conhecido';
        responseMessage = 'Digite o Nº de Processo da grávida (ou 0 se não souber):';
      } else if (trimmedText === '3') {
        session.step = 'NAO_CADASTRADA_NOME';
        session.data.canal = 'USSD *114#';
        session.data.tipo_solicitante = 'cidadao_desconhecido';
        session.data.gravida_cadastrada = false;
        responseMessage = 'Informe o nome da grávida (ou "Desconhecido"):';
      } else if (trimmedText === '4') {
        isEnd = true;
        ussdSessions.delete(sessionId);
        responseMessage = 'Sessão terminada. Em caso de risco de vida iminente, ligue imediatamente 114 ou 115.';
        return res.json({ message: responseMessage, isEnd, sessionStep: 'END' });
      } else {
        responseMessage = 'Opção inválida.\n1. Estou grávida\n2. Para outra grávida\n3. Não cadastrada\n4. Sair';
      }
    } else if (session.step === 'GRAVIDA_SINTOMAS') {
      const sintomasMap = {
        '1': 'Dor abdominal severa e sangramento ativo',
        '2': 'Perda abundante de líquido amniótico',
        '3': 'Cefaleia violenta e distúrbios visuais (suspeita eclâmpsia)',
        '4': 'Mal-estar gestacional agudo',
      };
      session.data.descricao_sintomas = sintomasMap[trimmedText] || 'Emergência obstétrica relatada via USSD';
      session.step = 'GRAVIDA_LOCAL';
      responseMessage =
        'Indique o seu Bairro e Ponto de Referência em Luanda:\n' +
        '(Ex: Cazenga, Tala Hady, perto da Esquadra)';
    } else if (session.step === 'GRAVIDA_LOCAL') {
      session.data.localizacao_texto = trimmedText;
      isEnd = true;

      // Criar ocorrência de emergência a partir do USSD
      const protocolo = await generateProtocolCode();
      const bairroEstimado = trimmedText.split(',')[0].trim() || 'Luanda Centro';
      const zonaInfo = await checkZoneAccessibility(bairroEstimado, 'Luanda');
      const triagem = evaluateObstetricPriority([], session.data.descricao_sintomas);

      await db.query(
        `INSERT INTO ocorrencias (
          protocolo_codigo, canal_entrada, solicitante_nome, solicitante_telefone, tipo_solicitante,
          relacao_gravida, gravida_cadastrada, descricao_sintomas, prioridade, justificativa_prioridade,
          municipio, bairro, ponto_referencia, origem_coordenadas, zona_vulneravel_id, classificacao_acesso_local,
          etapa_atual, estado_ocorrencia, latitude, longitude
        ) VALUES (
          $1, 'USSD *114#', $2, $3, $4, 'Própria', true, $5, $6, $7, 'Luanda', $8, $9, 'USSD Texto', $10, $11, 2, 'Nova', $12, $13
        )`,
        [
          protocolo,
          'Utente USSD (*114#)',
          phoneNumber,
          session.data.tipo_solicitante,
          session.data.descricao_sintomas,
          triagem.prioridadeSugerida,
          `Criado via canal USSD sem GPS automático. Localização descritiva fornecida: ${trimmedText}`,
          bairroEstimado,
          trimmedText,
          zonaInfo.id || null,
          zonaInfo.classificacao_acesso,
          zonaInfo.latitude || -8.8383,
          zonaInfo.longitude || 13.2344,
        ]
      );

      // SMS de confirmação
      await db.query(
        `INSERT INTO mensagens_sms_ussd (telefone_destino, tipo, conteudo)
         VALUES ($1, 'SMS_ENVIADO', $2)`,
        [phoneNumber, `MATERNITY SOS: Ocorrência ${protocolo} gerada via *114#. Central 114 informada. Mantenha telefone livre.`]
      );

      emitToCentral('occurrence:created', {
        protocolo_codigo: protocolo,
        canal_entrada: 'USSD *114#',
        bairro: bairroEstimado,
        descricao_sintomas: session.data.descricao_sintomas,
      });

      ussdSessions.delete(sessionId);
      responseMessage =
        `Ocorrência registada com sucesso!\n` +
        `Protocolo: ${protocolo}\n` +
        `A Central MATERNITY SOS 114 recebeu o seu alerta e já está a coordenar apoio. Mantenha o telefone livre.`;
    } else if (session.step === 'OUTRA_PROCESSO') {
      session.data.numero_processo = trimmedText !== '0' ? trimmedText : null;
      session.step = 'OUTRA_LOCAL';
      responseMessage = 'Informe o Bairro, Rua e Ponto de Referência onde se encontra a grávida:';
    } else if (session.step === 'OUTRA_LOCAL') {
      session.data.localizacao_texto = trimmedText;
      session.step = 'OUTRA_SINTOMAS';
      responseMessage = 'Descreva brevemente o que observa (ex: contrações fortes, sangramento, desmaio):';
    } else if (session.step === 'OUTRA_SINTOMAS') {
      session.data.descricao_sintomas = trimmedText;
      isEnd = true;

      const protocolo = await generateProtocolCode();
      const bairroEstimado = session.data.localizacao_texto.split(',')[0].trim() || 'Luanda';
      const zonaInfo = await checkZoneAccessibility(bairroEstimado, 'Luanda');
      const triagem = evaluateObstetricPriority([], trimmedText);

      await db.query(
        `INSERT INTO ocorrencias (
          protocolo_codigo, canal_entrada, solicitante_nome, solicitante_telefone, tipo_solicitante,
          relacao_gravida, gravida_cadastrada, descricao_sintomas, prioridade, justificativa_prioridade,
          municipio, bairro, ponto_referencia, origem_coordenadas, zona_vulneravel_id, classificacao_acesso_local,
          etapa_atual, estado_ocorrencia, latitude, longitude
        ) VALUES (
          $1, 'USSD *114#', 'Cidadão Auxílio (*114#)', $2, 'cidadao_conhecido', 'Acompanhante / Vizinho', true, $3, $4, $5, 'Luanda', $6, $7, 'USSD Texto', $8, $9, 2, 'Nova', $10, $11
        )`,
        [
          protocolo,
          phoneNumber,
          session.data.descricao_sintomas,
          triagem.prioridadeSugerida,
          `USSD Cidadão Auxílio. Ref: ${session.data.localizacao_texto}`,
          bairroEstimado,
          session.data.localizacao_texto,
          zonaInfo.id || null,
          zonaInfo.classificacao_acesso,
          zonaInfo.latitude || -8.8383,
          zonaInfo.longitude || 13.2344,
        ]
      );

      ussdSessions.delete(sessionId);
      responseMessage = `Alerta enviado! Protocolo: ${protocolo}. A equipa 114 entrará em contacto com este número.`;
    } else if (session.step === 'NAO_CADASTRADA_NOME') {
      session.data.solicitante_nome = trimmedText;
      session.step = 'GRAVIDA_LOCAL';
      responseMessage = 'Indique o Bairro e Ponto de Referência da grávida em Luanda:';
    }

    ussdSessions.set(sessionId, session);

    res.json({
      message: responseMessage,
      isEnd,
      sessionStep: session.step,
    });
  } catch (err) {
    next(err);
  }
};

// Atendimento Telefónico Direto pela Central (114)
const createPhoneIntake = async (req, res, next) => {
  try {
    const {
      solicitante_nome,
      solicitante_telefone,
      gravida_nome,
      numero_processo,
      gravida_cadastrada = true,
      descricao_sintomas,
      sinais_alerta = [],
      prioridade_atribuida,
      municipio = 'Luanda',
      bairro,
      rua,
      ponto_referencia,
      observacoes_chamada,
    } = req.body;

    if (!solicitante_telefone || !descricao_sintomas || !bairro || !ponto_referencia) {
      return res.status(400).json({
        success: false,
        message: 'Telefone, descrição, bairro e ponto de referência são obrigatórios no registo telefónico 114.',
      });
    }

    let resolvedGravidaId = null;
    if (numero_processo) {
      const g = await db.query('SELECT id FROM gravidas WHERE numero_processo = $1', [numero_processo.trim()]);
      if (g.rows.length > 0) resolvedGravidaId = g.rows[0].id;
    }

    const protocolo = await generateProtocolCode();
    const zonaInfo = await checkZoneAccessibility(bairro, municipio);

    const triagem = evaluateObstetricPriority(sinais_alerta, descricao_sintomas);
    const prioridadeFinal = prioridade_atribuida || triagem.prioridadeSugerida;

    const result = await db.query(
      `INSERT INTO ocorrencias (
        protocolo_codigo, canal_entrada, gravida_id, solicitante_nome, solicitante_telefone,
        tipo_solicitante, relacao_gravida, gravida_cadastrada, descricao_sintomas, sinais_alerta,
        prioridade, justificativa_prioridade, triagem_validada_por, triagem_data,
        municipio, bairro, rua, ponto_referencia, origem_coordenadas, zona_vulneravel_id,
        classificacao_acesso_local, etapa_atual, estado_ocorrencia, operador_atribuido_id,
        tempo_inicio, tempo_primeira_resposta, observacoes_gerais, latitude, longitude
      ) VALUES (
        $1, 'Chamada Telefónica 114', $2, $3, $4, 'operador_114', 'Atendimento Verbal Telefónico', $5, $6, $7,
        $8, $9, $10, CURRENT_TIMESTAMP, $11, $12, $13, $14, 'Entrada Manual', $15,
        $16, 3, 'Aguardando Despacho', $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $17, $18, $19
      ) RETURNING *`,
      [
        protocolo,
        resolvedGravidaId,
        solicitante_nome || gravida_nome || 'Chamada Telefónica 114',
        solicitante_telefone,
        gravida_cadastrada,
        descricao_sintomas,
        sinais_alerta,
        prioridadeFinal,
        `Registo direto de chamada 114 validado pelo operador ${req.user.nome}. ${triagem.justificativa}`,
        req.user.id,
        municipio,
        bairro,
        rua || 'Via telefónica',
        ponto_referencia,
        zonaInfo.id || null,
        zonaInfo.classificacao_acesso,
        `[Atendimento 114]: ${observacoes_chamada || 'Sem anotações complementares.'}`,
        zonaInfo.latitude || -8.8383,
        zonaInfo.longitude || 13.2344,
      ]
    );

    const novaOc = result.rows[0];

    // Histórico de ciclo
    await db.query(
      `INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
       VALUES ($1, 3, 'Nova', 'Aguardando Despacho', $2, $3, $4)`,
      [
        novaOc.id,
        req.user.id,
        `Chamada 114 acolhida e triada com prioridade ${prioridadeFinal}.`,
        JSON.stringify({ prioridade: prioridadeFinal, canal: 'Chamada Telefónica 114' }),
      ]
    );

    await logAudit({
      usuarioId: req.user.id,
      usuarioNome: req.user.nome,
      perfil: req.user.perfil,
      acao: 'CHAMADA_TELEFONICA_114',
      entidade: 'ocorrencias',
      entidadeId: novaOc.id,
      ipOrigem: req.ip,
      detalhes: `Chamada 114 acolhida para bairro ${bairro}. Protocolo: ${protocolo}`,
    });

    emitToCentral('occurrence:created', novaOc);

    res.status(201).json({
      success: true,
      message: 'Ocorrência telefónica registada com sucesso.',
      ocorrencia: novaOc,
    });
  } catch (err) {
    next(err);
  }
};

// Listar Mensagens SMS / Histórico
const getSmsLogs = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, o.protocolo_codigo, o.bairro
       FROM mensagens_sms_ussd s
       LEFT JOIN ocorrencias o ON s.ocorrencia_id = o.id
       ORDER BY s.created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      mensagens: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Enviar SMS Manual / Simulado
const sendSms = async (req, res, next) => {
  try {
    const { ocorrencia_id, telefone_destino, conteudo } = req.body;

    if (!telefone_destino || !conteudo) {
      return res.status(400).json({ success: false, message: 'Telefone e conteúdo são obrigatórios.' });
    }

    const result = await db.query(
      `INSERT INTO mensagens_sms_ussd (ocorrencia_id, telefone_destino, tipo, conteudo, status_entrega)
       VALUES ($1, $2, 'SMS_ENVIADO', $3, 'Entregue')
       RETURNING *`,
      [ocorrencia_id || null, telefone_destino, conteudo]
    );

    res.status(201).json({
      success: true,
      message: 'SMS expedido com sucesso para rede móvel de Luanda.',
      sms: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleUssdSession,
  createPhoneIntake,
  getSmsLogs,
  sendSms,
};
