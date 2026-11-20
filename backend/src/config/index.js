const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'mamasalva_default_secret_key_change_in_prod',
  databaseUrl: process.env.DATABASE_URL || 'postgres://mamasalva_user:mamasalva_secret@localhost:5432/mamasalva',
  dbHost: process.env.DB_HOST || '/tmp',
  dbPort: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5433,
  dbUser: process.env.DB_USER || 'mamasalva_user',
  dbPassword: process.env.DB_PASSWORD || 'mamasalva_secret',
  dbName: process.env.DB_NAME || 'mamasalva',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
