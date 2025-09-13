
// src/server.ts

import app from './app';
import { config } from './config';
import { logger } from './shared/lib/logger';
import { dbPool } from './infrastructure/db/client';
import { initDatabase } from './infrastructure/db/init';

const PORT = config.PORT;

const checkDatabaseConnection = async () => {
  try {
    const client = await dbPool.connect();
    logger.info('Database connected successfully!');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed');
    if (error instanceof Error) {
      logger.error({ message: error.message });
    }
    return false;
  }
};

const startServer = async () => {
  const isDbConnected = await checkDatabaseConnection();

  if (!isDbConnected) {
    logger.error({ message: 'Server cannot start without database connection' });
    process.exit(1);
  }

  try {
    await initDatabase();
    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error({
      message: 'Failed to initialize database tables',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Debug endpoints: http://localhost:${PORT}/api/debug`);
    logger.info(`Task API: http://localhost:${PORT}/api/tasks`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received: shutting down server`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await dbPool.end();
      logger.info('Database connection closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
};

startServer();

export default app;
