

// src/app.ts:

import express from 'express';
// import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './shared/lib/logger';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { corsMiddleware } from './shared/middlewares/cors.middleware';

// This file sets up middleware for security, 
// logging, and request handling. It mounts all the 
// API routes under /api and also has a /health 
// endpoint to quickly check if the server is running

// Import routes
import apiRoutes from './api';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
// Morgan middleware. A request logger that logs information about incoming HTTP requests,
app.use(morgan(config.isDev ? 'dev' : 'combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;