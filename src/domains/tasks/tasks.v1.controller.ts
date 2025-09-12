
// src/api/tasks/tasks.v1.controller.ts

import { Request, Response } from 'express';
import { TaskService } from '../../domains/tasks/task.service';
import { ValidationError, NotFoundError, AuthorizationError } from '../../shared/lib/errors';

// Initialize task service
const taskService = new TaskService();

// Create a new task
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { title, description, status, priority, due_date } = req.body;

    if (!title) throw new ValidationError('Title is required');

    const task = await taskService.createTask({
      title,
      description,
      status,
      priority,
      due_date: due_date ? new Date(due_date) : undefined,
      user_id: userId,
    });

    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all tasks for the authenticated user
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { status, priority, search } = req.query;

    const tasks = await taskService.getTasksByUser(userId, {
      status: status as any,
      priority: priority as any,
      search: search as string | undefined,
    });

    res.status(200).json({ success: true, data: { tasks } });
  } catch (error) {
    handleError(res, error);
  }
};

// Get a specific task
export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    const task = await taskService.getTaskById(id, userId);

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Update a task
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    const task = await taskService.updateTask(
      id,
      { title, description, status, priority, due_date: due_date ? new Date(due_date) : null },
      userId
    );

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a task
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    await taskService.deleteTask(id, userId);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark task as completed
export const markTaskAsCompleted = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    const task = await taskService.markTaskAsCompleted(id, userId);

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark task as pending
export const markTaskAsPending = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    const task = await taskService.markTaskAsPending(id, userId);

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Mark task as in progress
export const markTaskAsInProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    const task = await taskService.markTaskAsInProgress(id, userId);

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Archive a task
export const archiveTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new AuthorizationError('User not authenticated');

    const { id } = req.params;
    const task = await taskService.archiveTask(id, userId);

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    handleError(res, error);
  }
};

// Centralized error handler
function handleError(res: Response, error: any) {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof AuthorizationError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
  } else {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
