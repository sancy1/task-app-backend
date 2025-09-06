
// src/api/index.ts:

import { Router } from 'express';
import authRoutes from './auth/auth.v1.routes';
import tasksRoutes from './tasks/tasks.v1.routes';
import devicesRoutes from './devices/devices.v1.routes';
import helloRoutes from './hello/hello.v1.routes';

const router = Router();

// This file brings together all our route files under their respective paths.

// router.use('/auth', authRoutes);
// router.use('/tasks', tasksRoutes);
// router.use('/devices', devicesRoutes);
router.use('/hello', helloRoutes);

export default router;