-- ============================================================================
-- MATERNITY SOS — Sistema Integrado de Gestão e Coordenação de Emergências Obstétricas
-- Província de Luanda, Angola | Pilar: Care | Saúde e Proteção Social
-- Arquivo: database/schema.sql
-- ============================================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpeza preventiva de tabelas
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS mensagens_sms_ussd CASCADE;
DROP TABLE IF EXISTS ocorrencia_historico_estados CASCADE;
DROP TABLE IF EXISTS ocorrencias CASCADE;
DROP TABLE IF EXISTS escalas_operadores CASCADE;
DROP TABLE IF EXISTS ambulancias CASCADE;
DROP TABLE IF EXISTS zonas_vulneraveis CASCADE;
DROP TABLE IF EXISTS gravidas CASCADE;
DROP TABLE IF EXISTS maternidades CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. TABELA DE UTILIZADORES E CONTROLE DE ACESSO (7 PERFIS)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL CHECK (
        perfil IN (
            'gravida',
            'cidadao',
            'operador',
            'supervisor',
            'equipa_emergencia',
            'maternidade',
            'administrador'
        )
    ),
    municipio_base VARCHAR(100) DEFAULT 'Luanda',
    bairro_base VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultimo_acesso TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_perfil ON users(perfil);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telefone ON users(telefone);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE MATERNIDADES E CAPACIDADE OPERACIONAL
-- ----------------------------------------------------------------------------
CREATE TABLE maternidades (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    nome VARCHAR(150) NOT NULL,
    sigla VARCHAR(30) NOT NULL UNIQUE,
    municipio VARCHAR(100) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    endereco TEXT NOT NULL,
    telefone_emergencia VARCHAR(30) NOT NULL,
    telefone_recepcao VARCHAR(30) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    estado_funcionamento VARCHAR(50) NOT NULL DEFAULT 'Normal' CHECK (
        estado_funcionamento IN ('Normal', 'Sobrecarga', 'Restrito', 'Inoperante')
    ),
    camas_totais INT NOT NULL DEFAULT 40 CHECK (camas_totais >= 0),
    camas_obstetricas_livres INT NOT NULL DEFAULT 10 CHECK (camas_obstetricas_livres >= 0),
    salas_parto_ativas INT NOT NULL DEFAULT 4 CHECK (salas_parto_ativas >= 0),
    bloco_operatorio_disponivel BOOLEAN NOT NULL DEFAULT true,
    neonatologia_ativa BOOLEAN NOT NULL DEFAULT true,
    equipa_obstetrica_plantao VARCHAR(150) NOT NULL DEFAULT 'Equipa Alpha de Plantão',
    servicos_disponiveis TEXT[] NOT NULL DEFAULT '{"Parto Normal", "Cesariana de Emergência", "Cuidados Neonatais", "Hemoterapia", "Ecografia"}'::TEXT[],
    observacoes_capacidade TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maternidades_municipio ON maternidades(municipio);
CREATE INDEX idx_maternidades_estado ON maternidades(estado_funcionamento);

-- ----------------------------------------------------------------------------
-- 3. TABELA DE GRÁVIDAS CADASTRADAS (DADOS CLÍNICOS E PRÉ-NATAL)
-- ----------------------------------------------------------------------------
CREATE TABLE gravidas (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    numero_processo VARCHAR(50) NOT NULL UNIQUE,
    nome_completo VARCHAR(150) NOT NULL,
    data_nascimento DATE,
    idade INT CHECK (idade >= 10 AND idade <= 65),
    semanas_gestacao INT NOT NULL CHECK (semanas_gestacao >= 1 AND semanas_gestacao <= 45),
    telefone_contato VARCHAR(30) NOT NULL,
    telefone_alternativo VARCHAR(30),
    municipio_residencia VARCHAR(100) NOT NULL DEFAULT 'Luanda',
    bairro_residencia VARCHAR(100) NOT NULL,
    endereco_detalhado TEXT,
    ponto_referencia TEXT NOT NULL,
    latitude_residencia NUMERIC(10, 7),
    longitude_residencia NUMERIC(10, 7),
    maternidade_acompanhamento_id INT REFERENCES maternidades(id) ON DELETE SET NULL,
    condicoes_clinicas TEXT[] DEFAULT '{}'::TEXT[],
    grupo_sanguineo VARCHAR(10) CHECK (grupo_sanguineo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconhecido')),
    observacoes_prenatal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gravidas_processo ON gravidas(numero_processo);
CREATE INDEX idx_gravidas_telefone ON gravidas(telefone_contato);
CREATE INDEX idx_gravidas_bairro ON gravidas(bairro_residencia);

-- ----------------------------------------------------------------------------
-- 4. TABELA DE ZONAS VULNERÁVEIS E ACESSIBILIDADE VIÁRIA EM LUANDA
-- ----------------------------------------------------------------------------
CREATE TABLE zonas_vulneraveis (
    id SERIAL PRIMARY KEY,
    nome_zona VARCHAR(150) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    classificacao_acesso VARCHAR(60) NOT NULL CHECK (
        classificacao_acesso IN (
            'Acesso normal',
            'Acesso condicionado',
            'Acesso impossível para ambulância convencional'
        )
    ),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    descricao_condicoes TEXT NOT NULL,
    ponto_encontro_alternativo TEXT,
    latitude_ponto_encontro NUMERIC(10, 7),
    longitude_ponto_encontro NUMERIC(10, 7),
    bloqueio_ativo BOOLEAN NOT NULL DEFAULT false,
    motivo_bloqueio TEXT,
    bloqueio_verificado BOOLEAN NOT NULL DEFAULT true,
    reportado_por VARCHAR(150) DEFAULT 'Fiscalização Municipal',
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zonas_municipio ON zonas_vulneraveis(municipio);
CREATE INDEX idx_zonas_classificacao ON zonas_vulneraveis(classificacao_acesso);
CREATE INDEX idx_zonas_bloqueio ON zonas_vulneraveis(bloqueio_ativo);

-- ----------------------------------------------------------------------------
-- 5. TABELA DE AMBULÂNCIAS E EQUIPAS DE EMERGÊNCIA
-- ----------------------------------------------------------------------------
CREATE TABLE ambulancias (
    id SERIAL PRIMARY KEY,
    codigo_identificacao VARCHAR(50) NOT NULL UNIQUE,
    instituicao VARCHAR(100) NOT NULL, -- INEMA, Bombeiros, Cruz Vermelha
    tipo_veiculo VARCHAR(60) NOT NULL DEFAULT 'Ambulância de Suporte Básico' CHECK (
        tipo_veiculo IN (
            'Ambulância de Suporte Básico',
            'Ambulância de Suporte Avançado Obstétrico',
            'Veículo Ligeiro Todo-o-Terreno de Resgate'
        )
    ),
    matricula VARCHAR(30) NOT NULL,
    base_operacional VARCHAR(100) NOT NULL,
    zona_operacao_principal VARCHAR(100) NOT NULL,
    estado_operacional VARCHAR(50) NOT NULL DEFAULT 'Livre' CHECK (
        estado_operacional IN (
            'Livre',
            'A caminho da ocorrência',
            'No local',
            'Em transporte',
            'Indisponível'
        )
    ),
    latitude_atual NUMERIC(10, 7) NOT NULL,
    longitude_atual NUMERIC(10, 7) NOT NULL,
    equipa_responsavel VARCHAR(150) NOT NULL,
    contato_radio_telefone VARCHAR(50) NOT NULL,
    ultima_comunicacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alerta_falha_comunicacao BOOLEAN NOT NULL DEFAULT false,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_amb_estado ON ambulancias(estado_operacional);
CREATE INDEX idx_amb_instituicao ON ambulancias(instituicao);

-- ----------------------------------------------------------------------------
-- 6. TABELA DE OCORRÊNCIAS DE EMERGÊNCIA OBSTÉTRICA (CICLO EM 6 ETAPAS)
-- ----------------------------------------------------------------------------
CREATE TABLE ocorrencias (
    id SERIAL PRIMARY KEY,
    protocolo_codigo VARCHAR(50) NOT NULL UNIQUE,
    canal_entrada VARCHAR(50) NOT NULL CHECK (
        canal_entrada IN (
            'App Grávida',
            'Cidadão Auxílio',
            'Grávida Não Cadastrada',
            'USSD *114#',
            'Chamada Telefónica 114',
            'SMS'
        )
    ),
    gravida_id INT REFERENCES gravidas(id) ON DELETE SET NULL,
    solicitante_nome VARCHAR(150) NOT NULL,
    solicitante_telefone VARCHAR(50) NOT NULL,
    tipo_solicitante VARCHAR(50) NOT NULL CHECK (
        tipo_solicitante IN ('propria_gravida', 'cidadao_conhecido', 'cidadao_desconhecido', 'operador_114')
    ),
    relacao_gravida VARCHAR(100) DEFAULT 'Própria',
    gravida_cadastrada BOOLEAN NOT NULL DEFAULT true,
    descricao_sintomas TEXT NOT NULL,
    sinais_alerta TEXT[] DEFAULT '{}'::TEXT[],
    prioridade VARCHAR(30) NOT NULL DEFAULT 'Pendente' CHECK (
        prioridade IN (
            'Pendente',
            'Nível 1 - Vermelho',
            'Nível 2 - Amarelo',
            'Nível 3 - Verde'
        )
    ),
    justificativa_prioridade TEXT,
    triagem_validada_por INT REFERENCES users(id) ON DELETE SET NULL,
    triagem_data TIMESTAMPTZ,
    
    -- Localização
    municipio VARCHAR(100) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    rua VARCHAR(150),
    ponto_referencia TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    origem_coordenadas VARCHAR(50) NOT NULL DEFAULT 'GPS Automático' CHECK (
        origem_coordenadas IN ('GPS Automático', 'Entrada Manual', 'Ponto de Bairro Estimado', 'USSD Texto')
    ),
    zona_vulneravel_id INT REFERENCES zonas_vulneraveis(id) ON DELETE SET NULL,
    classificacao_acesso_local VARCHAR(60) NOT NULL DEFAULT 'Acesso normal' CHECK (
        classificacao_acesso_local IN (
            'Acesso normal',
            'Acesso condicionado',
            'Acesso impossível para ambulância convencional'
        )
    ),
    ponto_encontro_coordenadas TEXT,
    
    -- Ciclo em 6 etapas e estados
    etapa_atual INT NOT NULL DEFAULT 1 CHECK (etapa_atual BETWEEN 1 AND 6),
    estado_ocorrencia VARCHAR(50) NOT NULL DEFAULT 'Nova' CHECK (
        estado_ocorrencia IN (
            'Nova',
            'Em Triagem',
            'Aguardando Despacho',
            'Ambulância a Caminho',
            'Equipa no Local',
            'Em Transporte para Maternidade',
            'Chegada à Maternidade',
            'Recepção Confirmada',
            'Concluída',
            'Cancelada',
            'Sob Revisão de Suspeita'
        )
    ),
    
    -- Coordenação e encaminhamento
    operador_atribuido_id INT REFERENCES users(id) ON DELETE SET NULL,
    ambulancia_id INT REFERENCES ambulancias(id) ON DELETE SET NULL,
    maternidade_destino_id INT REFERENCES maternidades(id) ON DELETE SET NULL,
    maternidade_comunicada BOOLEAN NOT NULL DEFAULT false,
    maternidade_comunicada_em TIMESTAMPTZ,
    maternidade_confirmou_recepcao BOOLEAN NOT NULL DEFAULT false,
    maternidade_confirmacao_em TIMESTAMPTZ,
    maternidade_responsavel_recepcao VARCHAR(150),
    
    -- Marcadores de tempo operacionais (para relatórios e KPIs)
    tempo_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tempo_primeira_resposta TIMESTAMPTZ,
    tempo_atribuicao_equipa TIMESTAMPTZ,
    tempo_chegada_local TIMESTAMPTZ,
    tempo_conclusao TIMESTAMPTZ,
    
    -- Contingências e salvaguardas humanas
    is_suspeita_trote BOOLEAN NOT NULL DEFAULT false,
    motivo_suspeita TEXT,
    revisao_supervisor_feita BOOLEAN NOT NULL DEFAULT false,
    parecer_supervisor TEXT,
    alerta_supervisor_ativo BOOLEAN NOT NULL DEFAULT false,
    motivo_alerta_supervisor TEXT,
    observacoes_gerais TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ocorrencias_prioridade ON ocorrencias(prioridade);
CREATE INDEX idx_ocorrencias_estado ON ocorrencias(estado_ocorrencia);
CREATE INDEX idx_ocorrencias_etapa ON ocorrencias(etapa_atual);
CREATE INDEX idx_ocorrencias_ambulancia ON ocorrencias(ambulancia_id);
CREATE INDEX idx_ocorrencias_maternidade ON ocorrencias(maternidade_destino_id);
CREATE INDEX idx_ocorrencias_operador ON ocorrencias(operador_atribuido_id);
CREATE INDEX idx_ocorrencias_tempo_inicio ON ocorrencias(tempo_inicio);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE HISTÓRICO DE ESTADOS DA OCORRÊNCIA (AUDITORIA DO CICLO)
-- ----------------------------------------------------------------------------
CREATE TABLE ocorrencia_historico_estados (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INT NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
    etapa INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_novo VARCHAR(50) NOT NULL,
    atualizado_por_usuario_id INT REFERENCES users(id) ON DELETE SET NULL,
    descricao_evento TEXT NOT NULL,
    detalhes_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_ocorrencia ON ocorrencia_historico_estados(ocorrencia_id);

-- ----------------------------------------------------------------------------
-- 8. TABELA DE MENSAGENS E SIMULAÇÃO USSD / SMS
-- ----------------------------------------------------------------------------
CREATE TABLE mensagens_sms_ussd (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INT REFERENCES ocorrencias(id) ON DELETE SET NULL,
    telefone_destino VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('SMS_ENVIADO', 'SMS_RECEBIDO', 'USSD_SESSION')),
    conteudo TEXT NOT NULL,
    status_entrega VARCHAR(50) NOT NULL DEFAULT 'Entregue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_ocorrencia ON mensagens_sms_ussd(ocorrencia_id);

-- ----------------------------------------------------------------------------
-- 9. TABELA DE ESCALA E MONITORAMENTO DE OPERADORES
-- ----------------------------------------------------------------------------
CREATE TABLE escalas_operadores (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    turno VARCHAR(50) NOT NULL CHECK (
        turno IN ('Manhã (07h-15h)', 'Tarde (15h-23h)', 'Noite (23h-07h)')
    ),
    supervisor_responsavel_id INT REFERENCES users(id) ON DELETE SET NULL,
    status_operador VARCHAR(50) NOT NULL DEFAULT 'Disponível' CHECK (
        status_operador IN ('Disponível', 'Em atendimento', 'Pausa Técnica', 'Desconectado')
    ),
    total_atendimentos_turno INT NOT NULL DEFAULT 0,
    data_escala DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. TABELA DE AUDITORIA DE SISTEMA (AUDIT LOGS)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES users(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(150),
    perfil VARCHAR(50),
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id VARCHAR(50),
    ip_origem VARCHAR(50),
    dados_anteriores JSONB,
    dados_novos JSONB,
    detalhes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_acao ON audit_logs(acao);
CREATE INDEX idx_audit_entidade ON audit_logs(entidade);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
