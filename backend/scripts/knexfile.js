const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'hackathon_user',
    password: process.env.DB_PASSWORD || 'hackathon_password',
    database: process.env.DB_NAME || 'hackathon_db',
  },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    extension: 'js',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    extension: 'js',
  },
};