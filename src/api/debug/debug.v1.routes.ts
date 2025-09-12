
// // src/api/debug/debug.v1.routes.ts

// import { Router } from 'express';
// import { checkDatabase, initDatabaseTables } from './debug.v1.controller';

// const router = Router();

// // Debug routes for database management
// router.get('/db-check', checkDatabase); // Check if tables exist
// router.post('/db-init', initDatabaseTables); // Initialize tables

// export default router;




















// src/api/debug/debug.v1.routes.ts

import { Router } from 'express';
import {
  checkDatabase,
  initDatabaseTables,
  dropDatabaseTables,
  resetDatabase,
} from './debug.v1.controller';

const router = Router();

// Debug routes for database management
router.get('/db-check', checkDatabase);       // Check if tables exist
router.post('/db-init', initDatabaseTables);  // Initialize tables
router.post('/db-drop', dropDatabaseTables);  // Drop all tables (development only)
router.post('/db-reset', resetDatabase);      // Reset database (drop + recreate)

export default router;
