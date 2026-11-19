# MATERNITY SOS — Sistema Integrado de Gestão e Coordenação de Emergências Obstétricas
**Província de Luanda, Angola | Pilar: Care | Área de Atuação: Saúde e Proteção Social**

A plataforma **MATERNITY SOS** é uma solução de coordenação e apoio à decisão operacional para emergências obstétricas em Luanda. Seu objetivo primordial é reduzir a mortalidade materno-infantil acelerando a comunicação e o encaminhamento regulado de gestantes em risco, interligando **Grávidas**, **Cidadãos**, **Central 114**, **Equipas de Resgate (INEMA/Bombeiros)** e **Maternidades Hospitalares**.

> [!NOTE]
> O MATERNITY SOS atua como ferramenta de coordenação e apoio à decisão logística e clínica, sem substituir profissionais de saúde, serviços de emergência médica ou sistemas hospitalares existentes.

---

## 1. Estrutura do Projeto

```text
mamasalva/
├── database/
│   ├── schema.sql                 # Esquema normalizado PostgreSQL (tabelas, índices, CHECKs, audit_logs)
│   └── seed.sql                   # Dados fictícios realistas de Luanda (bairros, vias, maternidades, ambulâncias)
├── backend/
│   ├── .env.example               # Exemplo de variáveis de ambiente
│   ├── .env                       # Configuração ativa local
│   ├── package.json
│   └── src/
│       ├── config/index.js        # Configurações de porta, JWT, banco de dados e CORS
│       ├── db/index.js            # Pool de conexões PostgreSQL (suporta TCP e Unix Socket local)
│       ├── middlewares/
│       │   ├── auth.js            # Validação de token JWT Bearer
│       │   ├── rbac.js            # Controle de acesso baseado em papéis (7 perfis)
│       │   ├── audit.js           # Registro de auditoria operacional
│       │   └── errorHandler.js    # Tratamento centralizado de erros HTTP
│       ├── realtime/
│       │   └── socketHandler.js   # Eventos em tempo real via WebSockets (Socket.IO)
│       ├── services/
│       │   ├── occurrenceService.js        # Protocolo de triagem, ciclo de 6 etapas e privacidade
│       │   ├── ambulanceTrackingService.js # Cálculo de distâncias e deslocamento simulado
│       │   └── auditService.js             # Gravação de audit_logs
│       ├── controllers/
│       │   ├── auth.controller.js          # Login e alternador rápido para demonstração
│       │   ├── occurrences.controller.js   # Gestão do ciclo de vida das emergências
│       │   ├── ambulances.controller.js    # Estados operacionais e deslocamento
│       │   ├── maternities.controller.js   # Capacidades, camas e confirmação de recepção
│       │   ├── zones.controller.js         # Zonas vulneráveis e acessibilidade viária
│       │   ├── channels.controller.js      # Simulador USSD *114#, chamada 114 e SMS
│       │   ├── reports.controller.js       # Indicadores operacionais (KPIs) e auditoria
│       │   └── users.controller.js         # Utilizadores e pesquisa segura de gestantes
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── occurrences.routes.js
│       │   ├── ambulances.routes.js
│       │   ├── maternities.routes.js
│       │   ├── zones.routes.js
│       │   ├── channels.routes.js
│       │   ├── reports.routes.js
│       │   └── users.routes.js
│       └── server.js                       # Servidor Express + Socket.IO + Socket local
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                       # Design sóbrio institucional (sem estética artificial)
│       ├── context/
│       │   ├── AuthContext.jsx             # Autenticação e alternador demonstrativo
│       │   └── SocketContext.jsx           # Sincronização em tempo real e alertas
│       ├── services/
│       │   └── api.js                      # Comunicação com a API REST
│       ├── components/
│       │   ├── common/
│       │   │   ├── Header.jsx              # Cabeçalho institucional com telefones de socorro
│       │   │   ├── Badges.jsx              # Níveis de prioridade (L1/L2/L3) e rastreador de 6 etapas
│       │   │   ├── Modal.jsx
│       │   │   ├── NotificationBanner.jsx  # Alertas da regulação
│       │   │   └── ContingencyModal.jsx    # Guia para falta de net, GPS ou ambulâncias
│       │   ├── demo/
│       │   └── DemoGuideBar.jsx        # Barra superior para alternar perfis e cenários
│       │   ├── map/
│       │   │   └── LuandaMap.jsx           # Mapa interativo de Luanda com fallback SVG resiliente
│       │   └── channels/
│       │       ├── UssdSimulator.jsx       # Simulador interativo do menu USSD *114#
│       │       ├── PhoneIntakeModal.jsx    # Registo rápido de atendimento verbal 114
│       │       └── SmsLogDrawer.jsx        # Histórico de SMS enviados e recebidos
│       └── pages/
│           ├── LoginPage.jsx               # Login com preenchimento em 1 clique para os 7 perfis
│           ├── GravidaPortal.jsx           # Painel Grávida / Cidadão (Privacidade estrita)
│           ├── CallCenterDashboard.jsx     # Fila de prioridades e despacho do operador
│           ├── SupervisorDashboard.jsx     # Sala de regulação, sobrecarga e revisão de trotes
│           ├── EmergencyTeamDashboard.jsx  # Painel de bordo da ambulância e avanço simulado
│           ├── MaternityDashboard.jsx      # Gestão de camas obstétricas e confirmação de recepção
│           └── AdminDashboard.jsx          # Gestão RBAC, vias de Luanda, KPIs e Audit Logs
├── package.json
└── README.md
```

---

## 2. Perfis de Acesso e Credenciais de Demonstração

Todos os utilizadores de teste utilizam a palavra-passe padrão: `mamasalva123`

| # | Perfil | Nome Demonstrativo | Email | Contacto | Âmbito / Permissões |
|---|---|---|---|---|---|
| 1 | **Grávida** | Esperança Manuel (36 sem.) | `gravida@maternitysos.ao` | `+244 923 456 789` | Solicita ajuda, consulta pré-natal próprio e acompanha ambulância no mapa |
| 2 | **Cidadão / Acompanhante** | Domingos Sebastião | `cidadao@maternitysos.ao` | `+244 924 555 666` | Solicita ajuda para terceiras sem acesso ao histórico clínico confidencial |
| 3 | **Operador Call Center** | Teresa Neto | `operador@maternitysos.ao` | `+244 925 111 222` | Fila L1/L2/L3, triagem clínica protocolada, despacho e encaminhamento |
| 4 | **Supervisor da Central** | Dr. Rui Kapapelo | `supervisor@maternitysos.ao` | `+244 926 333 444` | Alertas de sobrecarga, vias degradadas, tempos de espera e revisão humana de trotes |
| 5 | **Equipa de Emergência** | Enf. Mateus Kipupa (INEMA) | `equipa@maternitysos.ao` | `+244 927 888 999` | Ocorrências atribuídas à sua viatura, estados operacionais e reporte de vias |
| 6 | **Maternidade** | Lucrécia Paim (Coordenação) | `maternidade@maternitysos.ao` | `+244 928 444 555` | Notificações de chegada, capacidade em tempo real e confirmação de recepção |
| 7 | **Administrador** | Eng. Amílcar Cabral | `admin@maternitysos.ao` | `+244 929 000 111` | Gestão de utilizadores, cadastro de vias em Luanda, relatórios e auditoria |

---

## 3. O Ciclo Completo em 6 Etapas

1. **Etapa 1 — Solicitação de Ajuda:**
   - Realizada via Smartphone (botão *"ESTOU A PASSAR MAL"*), auxílio por cidadão, registo emergencial sem cadastro prévio, sessão interativa USSD (`*114#`) ou chamada verbal (`114`).
2. **Etapa 2 — Registo da Ocorrência:**
   - Abertura de protocolo único (`MS-2026-XXXX`), captura de coordenadas GPS ou entrada manual do bairro e ponto de referência em Luanda, com cruzamento imediato de condições viárias.
3. **Etapa 3 — Análise e Prioridade:**
   - Protocolo obstétrico de apoio à decisão classifica preliminarmente a gravidade e o operador valida entre **Nível 1 (Vermelho - Crítico)**, **Nível 2 (Amarelo - Urgente)** e **Nível 3 (Verde - Não Crítico)**.
4. **Etapa 4 — Coordenação do Socorro:**
   - Despacho da viatura adequada (INEMA, Bombeiros, Cruz Vermelha). A viatura transita para *"A caminho da ocorrência"*, emitindo SMS com dados da equipa para o solicitante.
5. **Etapa 5 — Encaminhamento Hospitalar:**
   - Verificação em tempo real da maternidade indicada (ex.: Lucrécia Paim, Augusto Ngangula, Hospital Geral de Luanda) considerando camas livres, bloco cirúrgico e equipe ativa, com emissão de aviso prévio de recepção.
6. **Etapa 6 — Recepção e Conclusão:**
   - À chegada da gestante, o profissional médico da maternidade formaliza a entrada no sistema clicando em *"CONFIRMAR RECEPÇÃO DA GRÁVIDA"*, libertando a ambulância para novas missões.

---

## 4. Guia Rápido de Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL (v14+)

### Passo 1: Configurar Banco de Dados
```bash
# Criar utilizador e base de dados no PostgreSQL:
psql -U postgres -c "CREATE USER mamasalva_user WITH PASSWORD 'mamasalva_secret';"
psql -U postgres -c "CREATE DATABASE mamasalva OWNER mamasalva_user;"

# Executar schema e seed:
psql -U mamasalva_user -d mamasalva -f database/schema.sql
psql -U mamasalva_user -d mamasalva -f database/seed.sql
```

### Passo 2: Executar o Backend
```bash
cd backend
npm install
npm start
# O servidor inicia na porta 5000 (HTTP/WebSockets) e em socket local /tmp/mamasalva.sock
```

### Passo 3: Executar o Frontend
```bash
cd frontend
npm install
npm run dev
# Aceda em: http://localhost:5173
```

---

## 5. Roteiro dos Cenários Demonstrativos

### Cenário 1: Fluxo Completo de Emergência Obstétrica Crítica
1. Na barra superior **GUIA DE DEMONSTRAÇÃO**, clique em `1. Grávida` (ou faça login como Esperança Manuel).
2. Clique no botão vermelho **"ESTOU A PASSAR MAL — PEDIR AJUDA"**, selecione *Hemorragia ativa / Dor súbita* e confirme o envio.
3. Alterne no topo para `3. Operador 114`: localize a ocorrência no topo da fila (Nível 1 - Vermelho), confirme a triagem clínica e despache a ambulância INEMA `AMB-INEMA-01`.
4. Alterne para `5. Equipa INEMA`: visualize a rota no mapa de Luanda, clique em *Simular Deslocamento* e atualize para *Em Transporte*.
5. Alterne para `6. Maternidade`: visualize a notificação de chegada iminente e clique em **"CONFIRMAR RECEPÇÃO DA GRÁVIDA"** para concluir o ciclo.

### Cenário 2: Emergência em Zona de Difícil Acesso em Luanda
1. Alterne para `2. Cidadão` e clique em **"GRÁVIDA NÃO CADASTRADA — EMERGÊNCIA"**.
2. Indique o bairro **Tala Hady (Cazenga)** ou **Ngola Kiluanje (Sambizanga)**.
3. O sistema reconhece automaticamente a via como **"Acesso impossível para ambulância convencional"**, exibe o ponto de encontro alternativo (*Largo da 5ª Avenida / Esquadra*) e emite um alerta em tempo real na tela do **4. Supervisor**.
