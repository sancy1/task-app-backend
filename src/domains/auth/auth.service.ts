// src/domains/auth/auth.service.ts

import { randomBytes, createHash } from 'crypto';
import { UserRepository, CreateUserData } from '../users/user.repository';
import { hashPassword, comparePassword } from '../../shared/lib/crypto';
import { AuthenticationError, ValidationError, ConflictError, DatabaseError } from '../../shared/lib/errors';
import { jwtSign, jwtVerify } from '../../shared/lib/jwt';
import { dbPool } from '../../infrastructure/db/client';
import { config } from '../../config';

// Interface for login response
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// Interface for refresh token response
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Device session interface
interface DeviceSession {
  device_id: string;
  user_agent: string | undefined;
  ip_address: string;
}

// Authentication service
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // Register a new user
  async register(userData: Omit<CreateUserData, 'password_hash'> & { password: string }): Promise<LoginResponse> {
    // Validate input
    if (!userData.email || !userData.password) {
      throw new ValidationError('Email and password are required');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const password_hash = await hashPassword(userData.password);

    // Create user
    const user = await this.userRepository.create({
      email: userData.email,
      password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  }

  // Login user
  async login(email: string, password: string, deviceSession: DeviceSession): Promise<LoginResponse> {
    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceSession);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string, deviceSession: DeviceSession): Promise<RefreshTokenResponse> {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    // Hash the refresh token to compare with stored hash
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    try {
      // Find the device session with this refresh token
      const sessionResult = await dbPool.query(
        `SELECT ds.*, u.is_active 
         FROM device_sessions ds 
         JOIN users u ON ds.user_id = u.id 
         WHERE ds.refresh_token_hash = $1 AND ds.revoked = FALSE AND ds.expires_at > NOW() AND u.is_active = TRUE`,
        [refreshTokenHash]
      );

      if (sessionResult.rows.length === 0) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      const session = sessionResult.rows[0];

      // Verify the refresh token is valid for this user
      try {
        await jwtVerify(refreshToken, session.user_id);
      } catch (error) {
        // If token verification fails, mark as revoked
        await dbPool.query(
          'UPDATE device_sessions SET revoked = TRUE WHERE id = $1',
          [session.id]
        );
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session.user_id, deviceSession);

      // Revoke the old refresh token
      await dbPool.query(
        'UPDATE device_sessions SET revoked = TRUE WHERE id = $1',
        [session.id]
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new DatabaseError('Failed to refresh token');
    }
  }

  // Logout user (revoke all sessions or specific device)
  async logout(userId: string, deviceId?: string): Promise<void> {
    try {
      if (deviceId) {
        // Revoke specific device session
        await dbPool.query(
          'UPDATE device_sessions SET revoked = TRUE WHERE user_id = $1 AND device_id = $2',
          [userId, deviceId]
        );
      } else {
        // Revoke all sessions for user
        await dbPool.query(
          'UPDATE device_sessions SET revoked = TRUE WHERE user_id = $1',
          [userId]
        );
      }
    } catch (error) {
      throw new DatabaseError('Failed to logout');
    }
  }

  // Generate access and refresh tokens
  private async generateTokens(userId: string, deviceSession?: DeviceSession): Promise<{ accessToken: string; refreshToken: string }> {
    // Convert string time values to milliseconds for proper type compatibility
    const accessTokenExpiresIn = this.convertTimeToMilliseconds(config.JWT_EXPIRES_IN || '15m');
    const refreshTokenExpiresIn = this.convertTimeToMilliseconds(config.JWT_REFRESH_EXPIRES_IN || '7d');

    // Generate access token (short-lived)
    const accessToken = await jwtSign(
      { sub: userId, type: 'access' },
      { expiresIn: accessTokenExpiresIn }
    );

    // Generate refresh token (long-lived)
    const refreshToken = await jwtSign(
      { sub: userId, type: 'refresh' },
      { expiresIn: refreshTokenExpiresIn }
    );

    // If device session is provided, store the refresh token
    if (deviceSession) {
      const refreshTokenHash = this.hashRefreshToken(refreshToken);
      const expiresAt = new Date();
      
      // Calculate expiration date based on refresh token expiration
      const refreshTokenMs = this.convertTimeToMilliseconds(config.JWT_REFRESH_EXPIRES_IN || '7d');
      expiresAt.setTime(expiresAt.getTime() + refreshTokenMs);

      await dbPool.query(
        `INSERT INTO device_sessions (user_id, device_id, refresh_token_hash, user_agent, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, deviceSession.device_id, refreshTokenHash, deviceSession.user_agent, deviceSession.ip_address, expiresAt]
      );
    }

    return { accessToken, refreshToken };
  }

  // Convert time string to milliseconds for proper type compatibility
  private convertTimeToMilliseconds(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's': // seconds
        return value * 1000;
      case 'm': // minutes
        return value * 60 * 1000;
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      default:
        // If no unit specified, assume milliseconds
        return parseInt(timeString) || 15 * 60 * 1000; // Default to 15 minutes
    }
  }

  // Hash refresh token for secure storage
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Generate device ID for mobile clients
  generateDeviceId(): string {
    return randomBytes(16).toString('hex');
  }
}