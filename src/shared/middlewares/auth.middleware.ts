// src/shared/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from '../lib/jwt';
import { AuthenticationError } from '../lib/errors';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        type: string;
      };
    }
  }
}

// Authentication middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization header with Bearer token is required');
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const payload = await jwtVerify(token);

    // Check if token is an access token
    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    // Add user information to request object
    req.user = {
      id: payload.sub,
      type: payload.type
    };

    // Continue to next middleware
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};