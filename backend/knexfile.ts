import { Knex } from 'knex';
import * as dotenv from 'dotenv';
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      user: process.env.DB_USER || 'hackathon_user',
      password: process.env.DB_PASSWORD || 'hackathon_password',
      database: process.env.DB_NAME || 'hackathon_db',
    },
    migrations: {
      directory: './scripts/migrations',
      extension: 'js',
    },
  },
};

export default config;
