
// src/domains/users/user.repository.ts

import { dbPool } from '../../infrastructure/db/client';
import { NotFoundError, DatabaseError, ConflictError, ValidationError } from '../../shared/lib/errors';

// User data interface
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// User creation data interface
export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
}

// User repository for database operations
export class UserRepository {
  // Find user by ID
  async findById(id: string): Promise<User | null> {
    try {
      const result = await dbPool.query(
        'SELECT id, email, password_hash, first_name, last_name, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = TRUE',
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user by ID');
    }
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await dbPool.query(
        'SELECT id, email, password_hash, first_name, last_name, is_active, created_at, updated_at FROM users WHERE email = $1 AND is_active = TRUE',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user by email');
    }
  }

  // Create a new user
  async create(userData: CreateUserData): Promise<User> {
    try {
      const result = await dbPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, password_hash, first_name, last_name, is_active, created_at, updated_at`,
        [userData.email, userData.password_hash, userData.first_name || null, userData.last_name || null]
      );
      
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictError('User with this email already exists');
      }
      throw new DatabaseError('Failed to create user');
    }
  }

  // Update user
  async update(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic query based on provided fields
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (fields.length === 0) {
        throw new ValidationError('No valid fields provided for update');
      }

      // Add updated_at timestamp
      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id);

      const result = await dbPool.query(
        `UPDATE users SET ${fields.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING id, email, password_hash, first_name, last_name, is_active, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to update user');
    }
  }
}