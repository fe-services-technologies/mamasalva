const { Pool } = require('pg');
const config = require('../config');

// Configuração flexível: suporta Unix domain socket (/tmp) ou TCP URL
let poolConfig = {};

if (config.dbHost.startsWith('/') || !process.env.DATABASE_URL) {
  poolConfig = {
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
  };
} else {
  poolConfig = {
    connectionString: config.databaseUrl,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL inativo:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
