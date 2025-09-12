
// src/domains/tasks/task.service.ts

import { TaskRepository, Task, CreateTaskData, UpdateTaskData, TaskStatus, TaskPriority } from './task.repository';
import { NotFoundError, ValidationError, AuthorizationError } from '../../shared/lib/errors';

// Task service for business logic
export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  // Create a new task
  async createTask(taskData: CreateTaskData): Promise<Task> {
    if (!taskData.title || !taskData.user_id) {
      throw new ValidationError('Title and user ID are required');
    }

    if (taskData.title.length > 255) {
      throw new ValidationError('Title must be less than 255 characters');
    }

    return this.taskRepository.create(taskData);
  }

  // Get all tasks for a user with optional filters
  async getTasksByUser(
    userId: string,
    filters?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      search?: string;
    }
  ): Promise<Task[]> {
    return this.taskRepository.findByUserId(userId, filters);
  }

  // Get a specific task
  async getTaskById(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.user_id !== userId) {
      throw new AuthorizationError('You are not authorized to access this task');
    }

    return task;
  }

  // Update a task
  async updateTask(id: string, updates: UpdateTaskData, userId: string): Promise<Task> {
    await this.getTaskById(id, userId);
    return this.taskRepository.update(id, updates);
  }

  // Delete a task
  async deleteTask(id: string, userId: string): Promise<void> {
    await this.getTaskById(id, userId);
    return this.taskRepository.delete(id);
  }

  // Mark task as completed
  async markTaskAsCompleted(id: string, userId: string): Promise<Task> {
    await this.getTaskById(id, userId);
    return this.taskRepository.markAsCompleted(id);
  }

  // Mark task as pending
  async markTaskAsPending(id: string, userId: string): Promise<Task> {
    await this.getTaskById(id, userId);
    return this.taskRepository.markAsPending(id);
  }

  // Mark task as in progress
  async markTaskAsInProgress(id: string, userId: string): Promise<Task> {
    await this.getTaskById(id, userId);
    return this.taskRepository.markAsInProgress(id);
  }

  // Archive a task
  async archiveTask(id: string, userId: string): Promise<Task> {
    await this.getTaskById(id, userId);
    return this.taskRepository.archive(id);
  }
}
