

// src/shared/lib/logger.ts:


import pino from 'pino';
import { config } from '../../config';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    }
  } : undefined,
});