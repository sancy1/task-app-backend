
// src/Server.ts

import app from './app';
import { config } from './config';
import { logger } from './shared/lib/logger';
import { dbPool } from './infrastructure/db/client';

const PORT = config.PORT;

/* 
  This file is the entry point. Before starting the server, it checks the 
  PostgreSQL database connection using dbPool. If the DB isn’t connected, 
  the server won’t start. Once connected, the server runs on the port 
  defined in the .env file, and it also listens for shutdown signals 
  like SIGINT to close connections gracefully
*/

// Database connection check
const checkDatabaseConnection = async () => {
  try {
    const client = await dbPool.connect();
    logger.info('Database connected successfully!');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed');
    logger.error(error);
    return false;
  }
};

// Start server with database connection check
const startServer = async () => {
  // Check database connection first
  const isDbConnected = await checkDatabaseConnection();
  
  if (!isDbConnected) {
    logger.error('Server cannot start without database connection');
    process.exit(1);
  }

  // Start the server
  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    logger.info(`Health check available at: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received: shutting down server`);
    
    server.close(async () => {
      logger.info('HTTP server closed');
      
      // Close database connection
      await dbPool.end();
      logger.info('Database connection closed');
      
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
};

// Start the application
startServer();

export default app;