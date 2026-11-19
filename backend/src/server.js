const http = require('http');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require('./config');
const db = require('./db');
const { initSocket } = require('./realtime/socketHandler');
const { errorHandler } = require('./middlewares/errorHandler');

// Importação das Rotas
const authRoutes = require('./routes/auth.routes');
const occurrencesRoutes = require('./routes/occurrences.routes');
const ambulancesRoutes = require('./routes/ambulances.routes');
const maternitiesRoutes = require('./routes/maternities.routes');
const zonesRoutes = require('./routes/zones.routes');
const channelsRoutes = require('./routes/channels.routes');
const reportsRoutes = require('./routes/reports.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO para sincronização em tempo real
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

initSocket(io);

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'MATERNITY SOS — Coordenação de Emergências Obstétricas (Luanda)',
    timestamp: new Date().toISOString(),
  });
});

// Registro das Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/occurrences', occurrencesRoutes);
app.use('/api/ambulances', ambulancesRoutes);
app.use('/api/maternities', maternitiesRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

// Tratamento centralizado de erros
app.use(errorHandler);

const socketPath = '/tmp/mamasalva.sock';

// Inicialização do Servidor e teste de conexão PostgreSQL
const startServer = async () => {
  try {
    const res = await db.query('SELECT NOW() AS db_time, current_database() AS db_name');
    console.log(`[Database] PostgreSQL conectado com sucesso à base: ${res.rows[0].db_name}`);

    // Limpar socket unix antigo se existir
    if (fs.existsSync(socketPath)) {
      try { fs.unlinkSync(socketPath); } catch (e) {}
    }

    // Tratar erro de porta ocupada (EADDRINUSE) com mensagem explicativa
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Erro de Porta] A porta ${config.port} já está em uso.`);
        console.error(`Para liberar a porta no terminal Linux, execute:`);
        console.error(`  fuser -k ${config.port}/tcp`);
        console.error(`ou encontre e termine o processo com:`);
        console.error(`  kill -9 $(lsof -t -i:${config.port} 2>/dev/null || ss -tlpn | grep :${config.port} | awk '{print $NF}' | sed -E 's/.*pid=([0-9]+).*/\\1/')\n`);
      } else {
        console.error('[HTTP Server Error]:', err);
      }
      process.exit(1);
    });

    // Servidor TCP / WebSockets
    server.listen(config.port, () => {
      console.log(`[HTTP Server] MATERNITY SOS Backend escutando na porta: ${config.port}`);
    });

    // Servidor Unix Socket para interconexão local segura e rápida
    const unixServer = http.createServer(app);
    unixServer.listen(socketPath, () => {
      console.log(`[Unix Socket] API acessível localmente via socket: ${socketPath}`);
    });

    console.log(`================================================================`);
    console.log(` MATERNITY SOS Backend operacional.`);
    console.log(` Ambiente: ${config.nodeEnv}`);
    console.log(` API REST & WebSockets ativos.`);
    console.log(`================================================================`);
  } catch (err) {
    console.error('[Database Error] Falha crítica ao conectar ao PostgreSQL:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
