

// src/shared/lib/crypto.ts:

import bcrypt from 'bcryptjs';
import { config } from '../../config';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateRandomToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};