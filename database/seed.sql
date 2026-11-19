-- ============================================================================
-- MATERNITY SOS — Sistema Integrado de Gestão e Coordenação de Emergências Obstétricas
-- Província de Luanda, Angola | Pilar: Care | Saúde e Proteção Social
-- Arquivo: database/seed.sql
-- ============================================================================

-- Senha padrão para todos os utilizadores demonstrativos: 'mamasalva123'
-- Hash bcrypt gerado com 10 rounds:
-- $2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei

-- ----------------------------------------------------------------------------
-- 1. UTILIZADORES INICIAIS (COBERTURA DOS 7 PERFIS DE ACESSO)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, nome, email, telefone, password_hash, perfil, municipio_base, bairro_base)
VALUES
    (1, 'Esperança Manuel', 'gravida@maternitysos.ao', '+244923456789', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'gravida', 'Cazenga', 'Tala Hady'),
    (2, 'Domingos Sebastião', 'cidadao@maternitysos.ao', '+244924555666', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'cidadao', 'Sambizanga', 'Ngola Kiluanje'),
    (3, 'Teresa Neto', 'operador@maternitysos.ao', '+244925111222', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'operador', 'Luanda', 'Ingombota'),
    (4, 'Dr. Rui Kapapelo', 'supervisor@maternitysos.ao', '+244926333444', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'supervisor', 'Luanda', 'Maianga'),
    (5, 'Enf. Mateus Kipupa (INEMA Cazenga)', 'equipa@maternitysos.ao', '+244927888999', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'equipa_emergencia', 'Cazenga', 'Hoji-ya-Henda'),
    (6, 'Coordenação Maternidade Lucrécia Paim', 'maternidade@maternitysos.ao', '+244928444555', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'maternidade', 'Luanda', 'Maianga'),
    (7, 'Eng. Amílcar Cabral (Admin)', 'admin@maternitysos.ao', '+244929000111', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'administrador', 'Luanda', 'Ingombota'),
    (8, 'Beatriz Paulo', 'beatriz.paulo@maternitysos.ao', '+244912334455', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'gravida', 'Kilamba Kiaxi', 'Palanca'),
    (9, 'Teresa Cangombe', 'teresa.cangombe@maternitysos.ao', '+244931778899', '$2b$10$llKTpAcApI2W1VSiW/Xx4uhV6pRnSdIqF3e0wdiW6Ghs9YxZEEWei', 'gravida', 'Sambizanga', 'Bairro Operário');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ----------------------------------------------------------------------------
-- 2. MATERNIDADES DA PROVÍNCIA DE LUANDA
-- ----------------------------------------------------------------------------
INSERT INTO maternidades (id, user_id, nome, sigla, municipio, bairro, endereco, telefone_emergencia, telefone_recepcao, latitude, longitude, estado_funcionamento, camas_totais, camas_obstetricas_livres, salas_parto_ativas, bloco_operatorio_disponivel, neonatologia_ativa, equipa_obstetrica_plantao, servicos_disponiveis, observacoes_capacidade)
VALUES
    (1, 6, 'Maternidade Lucrécia Paim', 'MLP', 'Luanda', 'Maianga', 'Rua Amílcar Cabral, Largo da Maternidade, Maianga', '+244222339101', '+244222339102', -8.8268000, 13.2385000, 'Normal', 120, 14, 6, true, true, 'Equipa Obstétrica Alfa (3 Obstetras Seniores, 5 Parteiras Especialistas)', '{"Parto Normal Humanizado", "Cesariana de Emergência", "UTI Neonatal", "Hemoterapia / Banco de Sangue", "Ecografia Obstétrica 24h", "Cirurgia Ginecológica"}'::TEXT[], 'Fluxo normal. Banco de sangue abastecido para emergências obstétricas.'),
    (2, NULL, 'Maternidade Augusto Ngangula', 'MAN', 'Luanda', 'Rangel', 'Rua dos Coqueiros / Bairro Rangel', '+244222441220', '+244222441221', -8.8152000, 13.2498000, 'Normal', 80, 7, 4, true, true, 'Equipa Bravo (2 Obstetras, 4 Parteiras)', '{"Parto Normal", "Cesariana", "Cuidados Neonatais", "Ecografia de Triagem"}'::TEXT[], 'Bloco operatório 1 ativo para urgências.'),
    (3, NULL, 'Hospital Geral de Luanda', 'HGL', 'Kilamba Kiaxi', 'Palanca', 'Avenida Pedro de Castro Van-Dúnem Loy, Palanca', '+244222778800', '+244222778801', -8.8741000, 13.2652000, 'Normal', 70, 9, 3, true, true, 'Equipa Charlie (2 Obstetras, 3 Parteiras)', '{"Parto Normal", "Cesariana", "UTI Geral e Neonatal", "Laboratório 24h"}'::TEXT[], 'Recepção obstétrica disponível com capacidade estável.'),
    (4, NULL, 'Hospital Municipal de Cacuaco', 'HMC', 'Cacuaco', 'Vidrul', 'Estrada Nacional Luanda-Cacuaco, Km 14', '+244222990110', '+244222990111', -8.7830000, 13.3685000, 'Sobrecarga', 45, 2, 2, true, false, 'Equipa Delta (1 Obstetra de Turno, 2 Parteiras)', '{"Parto Normal", "Cesariana de Baixo Risco", "Observação Obstétrica"}'::TEXT[], 'Neonatologia com transferência prioritária para MLP ou HGL se houver prematuridade severa.'),
    (5, NULL, 'Hospital Municipal de Viana', 'HMV', 'Viana', 'Kapalanga', 'Estrada de Catete, Km 18, Kapalanga', '+244222881234', '+244222881235', -8.9050000, 13.3720000, 'Normal', 55, 6, 3, true, true, 'Equipa Eco (2 Médicos de Clínica Geral e Obstetrícia, 3 Parteiras)', '{"Parto Normal", "Cesariana", "Estabilização Materna", "Fototerapia"}'::TEXT[], 'Capacidade operacional normal e ambulância de suporte disponível.');

SELECT setval('maternidades_id_seq', (SELECT MAX(id) FROM maternidades));

-- ----------------------------------------------------------------------------
-- 3. GRÁVIDAS CADASTRADAS (PERFIS E DADOS PRÉ-NATAL)
-- ----------------------------------------------------------------------------
INSERT INTO gravidas (id, user_id, numero_processo, nome_completo, data_nascimento, idade, semanas_gestacao, telefone_contato, telefone_alternativo, municipio_residencia, bairro_residencia, endereco_detalhado, ponto_referencia, latitude_residencia, longitude_residencia, maternidade_acompanhamento_id, condicoes_clinicas, grupo_sanguineo, observacoes_prenatal)
VALUES
    (1, 1, 'GRAV-2026-0814', 'Esperança Manuel', '1998-04-12', 28, 36, '+244923456789', '+244912998877', 'Cazenga', 'Tala Hady', 'Rua dos Comandos, Casa 45', 'Próximo ao Centro de Saúde do Tala Hady', -8.8105000, 13.2750000, 1, '{"Hipertensão gestacional", "Anemia leve"}'::TEXT[], 'O+', 'Em acompanhamento no MLP. Risco pré-eclampsia monitorado. Medicada com metildopa.'),
    (2, 8, 'GRAV-2026-0925', 'Beatriz Paulo', '2004-09-18', 22, 32, '+244912334455', '+244933221100', 'Kilamba Kiaxi', 'Palanca', 'Rua F, Casa 12', 'Perto da Escola Primária 1024', -8.8720000, 13.2640000, 3, '{}'::TEXT[], 'A+', 'Primeira gestação sem intercorrências graves prévias.'),
    (3, 9, 'GRAV-2026-1102', 'Teresa Cangombe', '1992-02-05', 34, 38, '+244931778899', '+244922114433', 'Sambizanga', 'Bairro Operário', 'Rua Cónego Manuel das Neves, Travessa 4', 'Atrás do Mercado do São Paulo', -8.8020000, 13.2560000, 2, '{"Cesariana prévia", "Diabetes gestacional"}'::TEXT[], 'B+', 'Encaminhada para cesariana programada às 39 semanas.');

SELECT setval('gravidas_id_seq', (SELECT MAX(id) FROM gravidas));

-- ----------------------------------------------------------------------------
-- 4. ZONAS VULNERÁVEIS E ACESSIBILIDADE VIÁRIA EM LUANDA
-- ----------------------------------------------------------------------------
INSERT INTO zonas_vulneraveis (id, nome_zona, municipio, classificacao_acesso, latitude, longitude, descricao_condicoes, ponto_encontro_alternativo, latitude_ponto_encontro, longitude_ponto_encontro, bloqueio_ativo, motivo_bloqueio, bloqueio_verificado, reportado_por)
VALUES
    (1, 'Cazenga — Tala Hady (Beco dos Comandos)', 'Cazenga', 'Acesso impossível para ambulância convencional', -8.8105000, 13.2750000, 'Via estreita de terra batida, vala de drenagem sem tampa e lamaçal intransitável para viatura pesada/média.', 'Largo da 5ª Avenida / Esquadra do Tala Hady', -8.8140000, 13.2715000, true, 'Inundação e erosão pós-chuvas torrenciais', true, 'Comissão de Moradores do Tala Hady'),
    (2, 'Sambizanga — Ngola Kiluanje (Sector 3)', 'Sambizanga', 'Acesso impossível para ambulância convencional', -8.8020000, 13.2560000, 'Beco pedonal com escadarias irregulares e desnível acentuado; impossibilidade física de penetração de viatura.', 'Estrada de Cacuaco, Posto de Combustível Sonangol', -8.8055000, 13.2520000, true, 'Vala sanitária a céu aberto e declive acentuado', true, 'Equipa de Resgate Sambizanga'),
    (3, 'Viana — Estalagem (Sector B)', 'Viana', 'Acesso condicionado', -8.8920000, 13.3410000, 'Piso muito degradado com crateras; ambulância convencional só consegue circular a menos de 10 km/h.', 'Paragem da Estalagem, Estrada Direita de Viana', -8.8950000, 13.3380000, false, NULL, true, 'Fiscalização Municipal de Viana'),
    (4, 'Cacuaco — Mercado do Kicolo', 'Cacuaco', 'Acesso condicionado', -8.7690000, 13.3320000, 'Congestionamento intenso de candongueiros e transeuntes ao redor da feira; velocidade média muito reduzida.', 'Rotunda do Kicolo / Posto Policial', -8.7730000, 13.3350000, false, NULL, true, 'Direcção de Trânsito Cacuaco'),
    (5, 'Kilamba Kiaxi — Golfe 2', 'Kilamba Kiaxi', 'Acesso normal', -8.8650000, 13.2580000, 'Avenida asfaltada com boa sinalização e faixa desimpedida.', 'Rotunda do Camama', -8.8680000, 13.2600000, false, NULL, true, 'Administração Municipal Kilamba Kiaxi'),
    (6, 'Maianga — Cassenda', 'Maianga', 'Acesso normal', -8.8350000, 13.2320000, 'Vias pavimentadas com tráfego fluido e conexão direta ao Hospital Lucrécia Paim.', 'Avenida Revolução de Outubro', -8.8360000, 13.2330000, false, NULL, true, 'Fiscalização Maianga');

SELECT setval('zonas_vulneraveis_id_seq', (SELECT MAX(id) FROM zonas_vulneraveis));

-- ----------------------------------------------------------------------------
-- 5. AMBULÂNCIAS E EQUIPAS DE RESGATE
-- ----------------------------------------------------------------------------
INSERT INTO ambulancias (id, codigo_identificacao, instituicao, tipo_veiculo, matricula, base_operacional, zona_operacao_principal, estado_operacional, latitude_atual, longitude_atual, equipa_responsavel, contato_radio_telefone, user_id)
VALUES
    (1, 'AMB-INEMA-01', 'INEMA', 'Ambulância de Suporte Avançado Obstétrico', 'LD-72-88-FN', 'Base INEMA Cazenga', 'Cazenga / Sambizanga', 'Livre', -8.8120000, 13.2680000, 'Enf. Mateus Kipupa, Cond. Manuel Zola', '+244927888999 (Rádio Ch-4)', 5),
    (2, 'AMB-INEMA-02', 'INEMA', 'Ambulância de Suporte Básico', 'LD-44-12-GH', 'Base HGL Kilamba Kiaxi', 'Kilamba Kiaxi / Maianga', 'A caminho da ocorrência', -8.8710000, 13.2620000, 'Enf. Joana Santos, Cond. Pedro Afonso', '+244927111002 (Rádio Ch-2)', NULL),
    (3, 'AMB-BOMB-03', 'Serviço de Protecção Civil e Bombeiros', 'Ambulância de Suporte Básico', 'LD-88-33-BM', 'Quartel dos Bombeiros Viana', 'Viana / Cacuaco', 'Livre', -8.9010000, 13.3650000, 'Sub-chefe Kiala Alberto, Socorrista Paulo Dinis', '+244927111003 (Rádio Bombeiros 115)', NULL),
    (4, 'AMB-INEMA-04', 'INEMA', 'Ambulância de Suporte Avançado Obstétrico', 'LD-55-90-KL', 'Base Central Lucrécia Paim', 'Ingombota / Rangel / Maianga', 'Livre', -8.8260000, 13.2370000, 'Dra. Luísa Faria, Enf. António Bento', '+244927111004 (Rádio Ch-1)', NULL),
    (5, 'VEIC-RESG-05', 'Cruz Vermelha de Angola', 'Veículo Ligeiro Todo-o-Terreno de Resgate', 'LD-19-40-XR', 'Posto Sambizanga', 'Sambizanga / Cazenga Bairros Difíceis', 'Livre', -8.8060000, 13.2530000, 'Socorrista Simão Bento, Socorrista Carla Nzita', '+244927111005 (Rádio CVA)', NULL);

SELECT setval('ambulancias_id_seq', (SELECT MAX(id) FROM ambulancias));

-- ----------------------------------------------------------------------------
-- 6. OCORRÊNCIAS DE EXEMPLO (HISTÓRICAS E ATIVAS PARA DEMONSTRAÇÃO)
-- ----------------------------------------------------------------------------
-- Ocorrência 1: Nível 1 - Crítica (Esperança Manuel, Cazenga)
INSERT INTO ocorrencias (
    id, protocolo_codigo, canal_entrada, gravida_id, solicitante_nome, solicitante_telefone, tipo_solicitante, relacao_gravida,
    gravida_cadastrada, descricao_sintomas, sinais_alerta, prioridade, justificativa_prioridade, triagem_validada_por, triagem_data,
    municipio, bairro, rua, ponto_referencia, latitude, longitude, origem_coordenadas, zona_vulneravel_id, classificacao_acesso_local,
    ponto_encontro_coordenadas, etapa_atual, estado_ocorrencia, operador_atribuido_id, ambulancia_id, maternidade_destino_id,
    maternidade_comunicada, maternidade_comunicada_em, tempo_inicio, tempo_primeira_resposta, tempo_atribuicao_equipa
) VALUES (
    1, 'MS-2026-0091', 'App Grávida', 1, 'Esperança Manuel', '+244923456789', 'propria_gravida', 'Própria',
    true, 'Forte dor de cabeça, visão turva com pontos brilhantes e dor abdominal em barra súbita aos 36 semanas.',
    '{"Cefaleia intensa / Escotomas", "Dor epigástrica severa", "Suspeita de iminência de eclâmpsia"}'::TEXT[],
    'Nível 1 - Vermelho', 'Protocolo Obstétrico L1: Sintomatologia de pré-eclâmpsia grave com sinais premonitórios de convulsão iminente. Resposta imediata.',
    3, CURRENT_TIMESTAMP - INTERVAL '25 minutes',
    'Cazenga', 'Tala Hady', 'Rua dos Comandos', 'Próximo ao Centro de Saúde do Tala Hady', -8.8105000, 13.2750000,
    'GPS Automático', 1, 'Acesso impossível para ambulância convencional',
    'Largo da 5ª Avenida / Esquadra do Tala Hady (-8.814000, 13.271500)',
    4, 'Ambulância a Caminho', 3, 1, 1,
    true, CURRENT_TIMESTAMP - INTERVAL '15 minutes',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP - INTERVAL '18 minutes'
);

-- Ocorrência 2: Nível 2 - Urgente (Beatriz Paulo, Palanca)
INSERT INTO ocorrencias (
    id, protocolo_codigo, canal_entrada, gravida_id, solicitante_nome, solicitante_telefone, tipo_solicitante, relacao_gravida,
    gravida_cadastrada, descricao_sintomas, sinais_alerta, prioridade, justificativa_prioridade, triagem_validada_por, triagem_data,
    municipio, bairro, rua, ponto_referencia, latitude, longitude, origem_coordenadas, zona_vulneravel_id, classificacao_acesso_local,
    etapa_atual, estado_ocorrencia, operador_atribuido_id, ambulancia_id, maternidade_destino_id,
    tempo_inicio, tempo_primeira_resposta
) VALUES (
    2, 'MS-2026-0092', 'Cidadão Auxílio', 2, 'Domingos Sebastião', '+244924555666', 'cidadao_conhecido', 'Vizinho',
    true, 'Perda de líquido amniótico transparente contínuo há 2 horas com contrações espaçadas.',
    '{"Ruptura prematura de membranas", "Contrações uterinas regulares"}'::TEXT[],
    'Nível 2 - Amarelo', 'Protocolo Obstétrico L2: Ruptura prematura com feto a 32 semanas. Risco de prematuridade que necessita avaliação prioritária.',
    3, CURRENT_TIMESTAMP - INTERVAL '12 minutes',
    'Kilamba Kiaxi', 'Palanca', 'Rua F', 'Perto da Escola Primária 1024', -8.8720000, 13.2640000,
    'Entrada Manual', 5, 'Acesso normal',
    3, 'Aguardando Despacho', 3, NULL, 3,
    CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '12 minutes'
);

-- Ocorrência 3: Grávida Não Cadastrada em Zona de Difícil Acesso (Sambizanga)
INSERT INTO ocorrencias (
    id, protocolo_codigo, canal_entrada, gravida_id, solicitante_nome, solicitante_telefone, tipo_solicitante, relacao_gravida,
    gravida_cadastrada, descricao_sintomas, sinais_alerta, prioridade, justificativa_prioridade, triagem_validada_por, triagem_data,
    municipio, bairro, rua, ponto_referencia, latitude, longitude, origem_coordenadas, zona_vulneravel_id, classificacao_acesso_local,
    ponto_encontro_coordenadas, etapa_atual, estado_ocorrencia, operador_atribuido_id, ambulancia_id, maternidade_destino_id,
    alerta_supervisor_ativo, motivo_alerta_supervisor, tempo_inicio
) VALUES (
    3, 'MS-2026-0093', 'Grávida Não Cadastrada', NULL, 'Sebastião Vunge (Vizinho)', '+244928123456', 'cidadao_desconhecido', 'Vizinho de Beco',
    false, 'Mulher jovem em trabalho de parto ativo no chão, diz que a cabeça da criança está a querer sair e tem sangramento.',
    '{"Sensação de expulsão iminente", "Hemorragia genital", "Zona de difícil acesso"}'::TEXT[],
    'Nível 1 - Vermelho', 'Protocolo L1: Período expulsivo iminente em local sem condições assépticas e acesso impedido a viaturas normais.',
    NULL, NULL,
    'Sambizanga', 'Ngola Kiluanje', 'Beco da Lixeira Velha', 'Atrás do antigo armazém de peixe', -8.8020000, 13.2560000,
    'Ponto de Bairro Estimado', 2, 'Acesso impossível para ambulância convencional',
    'Posto Sonangol da Estrada de Cacuaco (-8.805500, 13.252000)',
    2, 'Em Triagem', 3, NULL, 2,
    true, 'Zona de acesso impossível para ambulância convencional sem alternativa viável imediata. Requer validação do supervisor para deslocação de equipa apeada ou veículo ligeiro de resgate.',
    CURRENT_TIMESTAMP - INTERVAL '8 minutes'
);

-- Ocorrências Históricas Concluídas (para KPIs)
INSERT INTO ocorrencias (
    id, protocolo_codigo, canal_entrada, gravida_id, solicitante_nome, solicitante_telefone, tipo_solicitante, relacao_gravida,
    gravida_cadastrada, descricao_sintomas, sinais_alerta, prioridade, justificativa_prioridade, triagem_validada_por, triagem_data,
    municipio, bairro, rua, ponto_referencia, latitude, longitude, origem_coordenadas, classificacao_acesso_local,
    etapa_atual, estado_ocorrencia, operador_atribuido_id, ambulancia_id, maternidade_destino_id,
    maternidade_comunicada, maternidade_confirmou_recepcao, maternidade_responsavel_recepcao,
    tempo_inicio, tempo_primeira_resposta, tempo_atribuicao_equipa, tempo_chegada_local, tempo_conclusao
) VALUES (
    4, 'MS-2026-0080', 'Chamada Telefónica 114', 3, 'Teresa Cangombe', '+244931778899', 'propria_gravida', 'Própria',
    true, 'Início de trabalho de parto com histórico de cesariana anterior.', '{"Cesariana prévia", "Contrações vigorosas"}'::TEXT[],
    'Nível 1 - Vermelho', 'Risco de rotura uterina com contrações e cesárea prévia.', 3, CURRENT_TIMESTAMP - INTERVAL '4 hours',
    'Sambizanga', 'Bairro Operário', 'Rua Cónego Manuel das Neves', 'Atrás do Mercado do São Paulo', -8.8020000, 13.2560000, 'GPS Automático', 'Acesso normal',
    6, 'Concluída', 3, 4, 1,
    true, true, 'Dra. Luísa Faria (Chefe da Equipa Obstétrica)',
    CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours 56 minutes', CURRENT_TIMESTAMP - INTERVAL '3 hours 50 minutes',
    CURRENT_TIMESTAMP - INTERVAL '3 hours 32 minutes', CURRENT_TIMESTAMP - INTERVAL '2 hours 15 minutes'
),
(
    5, 'MS-2026-0081', 'USSD *114#', NULL, 'Cidadão Manuel (Acompanhante)', '+244921998877', 'cidadao_conhecido', 'Irmão',
    false, 'Dores lombares intensas e sangramento moderado após queda.', '{"Trauma / Queda", "Metrorragia"}'::TEXT[],
    'Nível 2 - Amarelo', 'Trauma na gravidez com sangramento.', 3, CURRENT_TIMESTAMP - INTERVAL '6 hours',
    'Viana', 'Estalagem', 'Sector B, Rua 3', 'Perto do tanque de água da Estalagem', -8.8920000, 13.3410000, 'USSD Texto', 'Acesso condicionado',
    6, 'Concluída', 3, 3, 5,
    true, true, 'Enf. Chefe João Baptista',
    CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours 55 minutes', CURRENT_TIMESTAMP - INTERVAL '5 hours 45 minutes',
    CURRENT_TIMESTAMP - INTERVAL '5 hours 20 minutes', CURRENT_TIMESTAMP - INTERVAL '4 hours 10 minutes'
);

SELECT setval('ocorrencias_id_seq', (SELECT MAX(id) FROM ocorrencias));

-- ----------------------------------------------------------------------------
-- 7. HISTÓRICO DE AUDITORIA DO CICLO DAS OCORRÊNCIAS
-- ----------------------------------------------------------------------------
INSERT INTO ocorrencia_historico_estados (ocorrencia_id, etapa, estado_anterior, estado_novo, atualizado_por_usuario_id, descricao_evento, detalhes_json)
VALUES
    (1, 1, NULL, 'Nova', 1, 'Solicitação criada via aplicação móvel pela própria grávida com coordenadas GPS capturadas.', '{"canal": "App Grávida", "gps": "capturado"}'::JSONB),
    (1, 2, 'Nova', 'Em Triagem', 3, 'Registo acolhido pelo operador Teresa Neto. Início da avaliação de prioridade.', '{"operador": "Teresa Neto"}'::JSONB),
    (1, 3, 'Em Triagem', 'Aguardando Despacho', 3, 'Prioridade validada como Nível 1 - Vermelho conforme protocolo de cefaleia súbita e escotomas.', '{"prioridade": "Nível 1 - Vermelho"}'::JSONB),
    (1, 4, 'Aguardando Despacho', 'Ambulância a Caminho', 3, 'Despachada ambulância AMB-INEMA-01 (Suporte Avançado Obstétrico). Destino coordenado para Maternidade Lucrécia Paim.', '{"ambulancia": "AMB-INEMA-01", "destino": "Maternidade Lucrécia Paim"}'::JSONB),
    (3, 1, NULL, 'Nova', 3, 'Pedido emergencial registado por terceiro para grávida sem registo prévio.', '{"canal": "Grávida Não Cadastrada"}'::JSONB),
    (3, 2, 'Nova', 'Em Triagem', 3, 'Identificada via sem condições viárias (Acesso impossível). Alerta gerado para supervisão.', '{"alerta_supervisor": true}'::JSONB);

-- ----------------------------------------------------------------------------
-- 8. SIMULAÇÃO DE MENSAGENS SMS E USSD
-- ----------------------------------------------------------------------------
INSERT INTO mensagens_sms_ussd (ocorrencia_id, telefone_destino, tipo, conteudo, status_entrega)
VALUES
    (1, '+244923456789', 'SMS_ENVIADO', 'MATERNITY SOS: O seu pedido MS-2026-0091 foi recebido com Prioridade Vermelha. A ambulância AMB-INEMA-01 já foi despachada para o Tala Hady. Mantenha a calma e telefone desimpedido.', 'Entregue'),
    (1, '+244923456789', 'SMS_ENVIADO', 'MATERNITY SOS: Devido a condições viárias na Rua dos Comandos, a equipa de apoio aguardará no Largo da 5ª Avenida / Esquadra. Contacto da equipa: +244927888999.', 'Entregue'),
    (5, '+244921998877', 'USSD_SESSION', 'Sessão *114# finalizada. Ocorrência MS-2026-0081 gerada com sucesso para Viana Estalagem. Equipa 114 a coordenar socorro.', 'Entregue');

-- ----------------------------------------------------------------------------
-- 9. ESCALAS DE OPERADORES
-- ----------------------------------------------------------------------------
INSERT INTO escalas_operadores (usuario_id, turno, supervisor_responsavel_id, status_operador, total_atendimentos_turno, data_escala)
VALUES
    (3, 'Manhã (07h-15h)', 4, 'Disponível', 6, CURRENT_DATE),
    (7, 'Manhã (07h-15h)', 4, 'Disponível', 2, CURRENT_DATE);

-- ----------------------------------------------------------------------------
-- 10. AUDIT LOGS INICIAIS
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (usuario_id, usuario_nome, perfil, acao, entidade, entidade_id, ip_origem, detalhes)
VALUES
    (3, 'Teresa Neto', 'operador', 'TRIAGEM_VALIDADA', 'ocorrencias', '1', '192.168.1.15', 'Classificação de prioridade Nível 1 - Vermelho atribuída para protocolo MS-2026-0091.'),
    (3, 'Teresa Neto', 'operador', 'DESPACHO_AMBULANCIA', 'ambulancias', '1', '192.168.1.15', 'Ambulância AMB-INEMA-01 alocada à ocorrência MS-2026-0091.'),
    (4, 'Dr. Rui Kapapelo', 'supervisor', 'ALERTA_ACESSO_ANALISADO', 'zonas_vulneraveis', '1', '192.168.1.10', 'Verificação de via com acesso impossível no Tala Hady e validação de ponto de encontro alternativo.');
