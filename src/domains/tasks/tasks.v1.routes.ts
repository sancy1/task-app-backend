
// src/api/tasks/tasks.v1.routes.ts

import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
  markTaskAsPending,
  markTaskAsInProgress,
  archiveTask,
} from './tasks.v1.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

// Task CRUD routes
router.post('/', createTask);       // Create a new task
router.get('/', getTasks);          // Get all tasks for the authenticated user
router.get('/:id', getTask);        // Get a specific task
router.put('/:id', updateTask);     // Update a task
router.delete('/:id', deleteTask);  // Delete a task

// Task status management routes
router.patch('/:id/complete', markTaskAsCompleted);     // Mark task as completed
router.patch('/:id/pending', markTaskAsPending);       // Mark task as pending
router.patch('/:id/in-progress', markTaskAsInProgress); // Mark task as in progress
router.patch('/:id/archive', archiveTask);             // Archive a task

export default router;
