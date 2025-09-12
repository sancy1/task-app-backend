
// // src/infrastructure/db/init.ts

// import { dbPool } from './client';

// export const initDatabase = async (): Promise<void> => {
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

//     console.log('Database tables initialized successfully!');
//   } catch (error) {
//     console.error('Failed to initialize database:', error);
//     throw error;
//   }
// };























// src/infrastructure/db/init.ts

import { dbPool } from './client';

export const initDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database tables for Neon PostgreSQL...');
    
    // Create users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table initialized');

    // Create device_sessions table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS device_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        device_id TEXT NOT NULL,
        refresh_token_hash TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Device sessions table initialized');

    // Create tasks table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        due_date TIMESTAMP WITH TIME ZONE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Tasks table initialized');

    // Create indexes
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_device_sessions_refresh_token_hash ON device_sessions(refresh_token_hash);
      CREATE INDEX IF NOT EXISTS idx_device_sessions_expires_at ON device_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `);
    console.log('Database indexes created');

    console.log('All database tables initialized successfully for Neon!');
  } catch (error) {
    console.error('Failed to initialize database with Neon:', error);
    throw error;
  }
};

// Function to check if database is connected and tables exist
export const checkDatabaseStatus = async (): Promise<{
  connected: boolean;
  tables: {
    users: boolean;
    device_sessions: boolean;
    tasks: boolean;
  };
}> => {
  try {
    // Test connection
    await dbPool.query('SELECT 1');
    
    // Check if tables exist
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

    return {
      connected: true,
      tables: {
        users: usersTable.rows[0].exists,
        device_sessions: sessionsTable.rows[0].exists,
        tasks: tasksTable.rows[0].exists
      }
    };
  } catch (error) {
    console.error('Database status check failed:', error);
    return {
      connected: false,
      tables: {
        users: false,
        device_sessions: false,
        tasks: false
      }
    };
  }
};
