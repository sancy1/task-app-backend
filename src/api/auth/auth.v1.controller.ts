
// src/api/auth/auth.v1.controller.ts

import { Request, Response } from 'express';
import { AuthService } from '../../domains/auth/auth.service';
import { UserRepository } from '../../domains/users/user.repository';
import { ValidationError, AuthenticationError, NotFoundError } from '../../shared/lib/errors';

// Initialize auth service
const authService = new AuthService();
const userRepository = new UserRepository();

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Register user
    const result = await authService.register({
      email,
      password,
      first_name,
      last_name
    });

    // Determine if this is a web request (has cookies) or mobile request
    const isWebRequest = req.headers['user-agent']?.includes('Mozilla') || false;

    if (isWebRequest) {
      // For web: set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return response without refresh token in body for web
      res.status(201).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } else {
      // For mobile: return refresh token in response body
      res.status(201).json({
        success: true,
        data: result
      });
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
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

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Generate device ID for mobile clients (web clients don't need this)
    let deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) {
      deviceId = authService.generateDeviceId();
    }

    // Login user
    const result = await authService.login(email, password, {
      device_id: deviceId,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip || req.connection.remoteAddress || ''
    });

    // Determine if this is a web request (has cookies) or mobile request
    const isWebRequest = req.headers['user-agent']?.includes('Mozilla') || false;

    if (isWebRequest) {
      // For web: set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return response without refresh token in body for web
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } else {
      // For mobile: return device ID and refresh token in response body
      res.status(200).json({
        success: true,
        data: {
          ...result,
          deviceId // Return device ID so mobile client can store it
        }
      });
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
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

// Refresh access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    let refreshToken: string;

    // Check if refresh token is in cookies (web) or body (mobile)
    if (req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    } else {
      throw new AuthenticationError('Refresh token is required');
    }

    // Get device ID for mobile clients
    const deviceId = req.headers['x-device-id'] as string || 'web';

    // Refresh tokens
    const result = await authService.refreshToken(refreshToken, {
      device_id: deviceId,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip || req.connection.remoteAddress || ''
    });

    // Determine if this is a web request (has cookies) or mobile request
    const isWebRequest = req.cookies.refreshToken ? true : false;

    if (isWebRequest) {
      // For web: set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return response without refresh token in body for web
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken
        }
      });
    } else {
      // For mobile: return new refresh token in response body
      res.status(200).json({
        success: true,
        data: result
      });
    }
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

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request (requires auth middleware)
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Get device ID for mobile clients
    const deviceId = req.headers['x-device-id'] as string;

    // Logout user (revoke tokens)
    await authService.logout(userId, deviceId);

    // Clear refresh token cookie for web clients
    if (req.cookies.refreshToken) {
      res.clearCookie('refreshToken');
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
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

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated');
    }

    // Fetch complete user details from database
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return complete user profile (excluding sensitive data like password_hash)
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
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