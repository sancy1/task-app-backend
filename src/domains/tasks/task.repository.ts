
// src/domains/tasks/task.repository.ts

import { dbPool } from '../../infrastructure/db/client';
import { NotFoundError, DatabaseError, ValidationError } from '../../shared/lib/errors';

// Task status types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

// Priority levels for tasks
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Task data interface
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: Date | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

// Task creation data interface
export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date;
  user_id: string;
}

// Task update data interface
export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date | null;
}

// Task repository for database operations
export class TaskRepository {
  async findById(id: string): Promise<Task | null> {
    try {
      const result = await dbPool.query(
        `SELECT id, title, description, status, priority, due_date, user_id, 
                created_at, updated_at, completed_at 
         FROM tasks 
         WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch {
      throw new DatabaseError('Failed to find task by ID');
    }
  }

  async findByUserId(
    userId: string,
    filters?: { status?: TaskStatus; priority?: TaskPriority; search?: string }
  ): Promise<Task[]> {
    try {
      let query = `
        SELECT id, title, description, status, priority, due_date, user_id, 
               created_at, updated_at, completed_at 
        FROM tasks 
        WHERE user_id = $1
      `;

      const params: any[] = [userId];
      let paramCount = 2;

      if (filters?.status) {
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters?.priority) {
        query += ` AND priority = $${paramCount}`;
        params.push(filters.priority);
        paramCount++;
      }

      if (filters?.search) {
        query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await dbPool.query(query, params);
      return result.rows;
    } catch {
      throw new DatabaseError('Failed to find tasks by user ID');
    }
  }

  async create(taskData: CreateTaskData): Promise<Task> {
    try {
      const result = await dbPool.query(
        `INSERT INTO tasks (title, description, status, priority, due_date, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, title, description, status, priority, due_date, user_id, 
                   created_at, updated_at, completed_at`,
        [
          taskData.title,
          taskData.description || null,
          taskData.status || 'pending',
          taskData.priority || 'medium',
          taskData.due_date || null,
          taskData.user_id,
        ]
      );
      return result.rows[0];
    } catch {
      throw new DatabaseError('Failed to create task');
    }
  }

  async update(id: string, updates: UpdateTaskData): Promise<Task> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

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

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      if (updates.status === 'completed') {
        fields.push(`completed_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      } else if (updates.status) {
        fields.push(`completed_at = $${paramCount}`);
        values.push(null);
        paramCount++;
      }

      values.push(id);

      const result = await dbPool.query(
        `UPDATE tasks SET ${fields.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING id, title, description, status, priority, due_date, user_id, 
                   created_at, updated_at, completed_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Task not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      throw new DatabaseError('Failed to update task');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await dbPool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) throw new NotFoundError('Task not found');
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to delete task');
    }
  }

  async markAsCompleted(id: string): Promise<Task> {
    return this.update(id, { status: 'completed' });
  }
  async markAsPending(id: string): Promise<Task> {
    return this.update(id, { status: 'pending' });
  }
  async markAsInProgress(id: string): Promise<Task> {
    return this.update(id, { status: 'in_progress' });
  }
  async archive(id: string): Promise<Task> {
    return this.update(id, { status: 'archived' });
  }
}
