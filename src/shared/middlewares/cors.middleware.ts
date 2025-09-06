
// src/shared/middlewares/cors.middleware.ts

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from '../../config';

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://10.0.2.2:3000',           // Android emulator
  'http://192.168.0.197:3000',       // Physical device on LAN — use your actual IP
  'exp://localhost:*',
  'exp://192.168.0.197:*',           // Expo Go LAN
  // Add your production domains here:
  // 'https://yourapp.com',
  // 'https://www.yourapp.com',
];

// CORS options
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || config.isDev) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Authorization',
    'Set-Cookie'
  ],
  maxAge: 600 // How long the results of a preflight request can be cached (in seconds)
};

// Create the CORS middleware
export const corsMiddleware = cors(corsOptions);

// Optional: Custom CORS handler for more control
export const corsHandler = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  if (origin && (allowedOrigins.includes(origin) || config.isDev)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};