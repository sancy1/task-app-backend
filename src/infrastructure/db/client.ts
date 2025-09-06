
// src/infrastructure/db/client.ts:

import { Pool } from 'pg';
import { config } from '../../config';

// Create a new Pool instance with Neon connection details
export const dbPool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.isProd ? { rejectUnauthorized: false } : false,
});

// Test the connection
dbPool.on('connect', () => {
  console.log('Connected to PostgreSQL database with Neon');
});

dbPool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await dbPool.end();
  console.log('Database pool has ended');
  process.exit(0);
});