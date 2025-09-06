
// src/config/index.ts:

import dotenv from 'dotenv';
import { cleanEnv, str, num, url } from 'envalid';

dotenv.config();

export const config = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: num({ default: 3000 }),
  
  DATABASE_URL: url(),
  
  JWT_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  
  BCRYPT_SALT_ROUNDS: num({ default: 12 }),
  
  LOG_LEVEL: str({ choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'], default: 'info' }),
});