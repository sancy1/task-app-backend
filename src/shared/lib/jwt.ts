// src/shared/lib/jwt.ts

// src/shared/lib/jwt.ts

import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AuthenticationError } from './errors';

// JWT payload interface
export interface JwtPayload {
  sub: string; // user ID
  type: 'access' | 'refresh';
  iat?: number; // issued at
  exp?: number; // expiration time
}

// Sign JWT token
export const jwtSign = (payload: Omit<JwtPayload, 'iat' | 'exp'>, options?: jwt.SignOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Determine which secret to use based on token type
    const secret = payload.type === 'access' ? config.JWT_SECRET : config.JWT_REFRESH_SECRET;
    
    // Convert string expiresIn to proper format if needed
    const signOptions: jwt.SignOptions = {
      ...options,
      expiresIn: options?.expiresIn || undefined
    };
    
    jwt.sign(
      payload,
      secret,
      signOptions,
      (err, token) => {
        if (err) {
          reject(new AuthenticationError('Failed to generate token'));
        } else {
          resolve(token as string);
        }
      }
    );
  });
};

// Verify JWT token
export const jwtVerify = (token: string, expectedUserId?: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    // Try to verify with access token secret first
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        const payload = decoded as JwtPayload;
        
        // If expected user ID is provided, check if it matches
        if (expectedUserId && payload.sub !== expectedUserId) {
          reject(new AuthenticationError('Token does not match user'));
          return;
        }
        
        resolve(payload);
        return;
      }
      
      // If access token verification failed, try with refresh token secret
      jwt.verify(token, config.JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
          reject(new AuthenticationError('Invalid token'));
          return;
        }
        
        const payload = decoded as JwtPayload;
        
        // If expected user ID is provided, check if it matches
        if (expectedUserId && payload.sub !== expectedUserId) {
          reject(new AuthenticationError('Token does not match user'));
          return;
        }
        
        resolve(payload);
      });
    });
  });
};