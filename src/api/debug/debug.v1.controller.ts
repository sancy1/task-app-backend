
// // src/api/debug/debug.v1.controller.ts

// import { Request, Response } from 'express';
// import { dbPool } from '../../infrastructure/db/client';

// // Check if database tables exist
// export const checkDatabase = async (req: Request, res: Response): Promise<void> => {
//   try {
//     // Check if users table exists
//     const usersTable = await dbPool.query(`
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables 
//         WHERE table_schema = 'public' 
//         AND table_name = 'users'
//       );
//     `);

//     // Check if device_sessions table exists
//     const sessionsTable = await dbPool.query(`
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables 
//         WHERE table_schema = 'public' 
//         AND table_name = 'device_sessions'
//       );
//     `);

//     res.status(200).json({
//       success: true,
//       data: {
//         users_table_exists: usersTable.rows[0].exists,
//         device_sessions_table_exists: sessionsTable.rows[0].exists
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: 'Database check failed',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// // Initialize database tables
// export const initDatabaseTables = async (req: Request, res: Response): Promise<void> => {
//   try {
//     console.log('Initializing database tables...');
    
//     // Create users table
//     await dbPool.query(`
//       CREATE TABLE IF NOT EXISTS users (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         email VARCHAR(255) UNIQUE NOT NULL,
//         password_hash TEXT NOT NULL,
//         first_name VARCHAR(100),
//         last_name VARCHAR(100),
//         is_active BOOLEAN DEFAULT TRUE,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Create device_sessions table
//     await dbPool.query(`
//       CREATE TABLE IF NOT EXISTS device_sessions (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//         device_id TEXT NOT NULL,
//         refresh_token_hash TEXT NOT NULL,
//         user_agent TEXT,
//         ip_address TEXT,
//         last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
//         revoked BOOLEAN DEFAULT FALSE,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Create indexes
//     await dbPool.query(`
//       CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
//       CREATE INDEX IF NOT EXISTS idx_device_sessions_refresh_token_hash ON device_sessions(refresh_token_hash);
//       CREATE INDEX IF NOT EXISTS idx_device_sessions_expires_at ON device_sessions(expires_at);
//     `);

//     res.status(200).json({
//       success: true,
//       message: 'Database tables initialized successfully!'
//     });
//   } catch (error) {
//     console.error('Failed to initialize database:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to initialize database',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };





















// src/api/debug/debug.v1.controller.ts

import { Request, Response } from 'express';
import { dbPool } from '../../infrastructure/db/client';
import { initDatabase } from '../../infrastructure/db/init';

// Check if database tables exist
export const checkDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const usersTable = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    const sessionsTable = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_sessions'
      );
    `);

    const tasksTable = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      );
    `);

    res.status(200).json({
      success: true,
      data: {
        users_table_exists: usersTable.rows[0].exists,
        device_sessions_table_exists: sessionsTable.rows[0].exists,
        tasks_table_exists: tasksTable.rows[0].exists,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Initialize database tables
export const initDatabaseTables = async (req: Request, res: Response): Promise<void> => {
  try {
    await initDatabase();

    res.status(200).json({
      success: true,
      message: 'Database tables initialized successfully!',
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Drop all tables (for development/testing only)
export const dropDatabaseTables = async (req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('DROP TABLE IF EXISTS device_sessions CASCADE;');
    await dbPool.query('DROP TABLE IF EXISTS tasks CASCADE;');
    await dbPool.query('DROP TABLE IF EXISTS users CASCADE;');

    res.status(200).json({
      success: true,
      message: 'Database tables dropped successfully!',
    });
  } catch (error) {
    console.error('Failed to drop database tables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to drop database tables',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Reset database (drop and recreate tables)
export const resetDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    await dbPool.query('DROP TABLE IF EXISTS device_sessions CASCADE;');
    await dbPool.query('DROP TABLE IF EXISTS tasks CASCADE;');
    await dbPool.query('DROP TABLE IF EXISTS users CASCADE;');

    await initDatabase();

    res.status(200).json({
      success: true,
      message: 'Database reset successfully!',
    });
  } catch (error) {
    console.error('Failed to reset database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset database',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
