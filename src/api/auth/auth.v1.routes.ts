
// src/api/auth/auth.v1.routes.ts


import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile } from './auth.v1.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';

// Create router instance
const router = Router();

// Public routes
router.post('/register', register); // Register new user
router.post('/login', login); // Login user
router.post('/refresh', refreshToken); // Refresh access token

// Protected routes (require authentication)
router.post('/logout', authMiddleware, logout); // Logout user
router.get('/profile', authMiddleware, getProfile); // Get user profile

// Export router
export default router;

