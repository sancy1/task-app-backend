

// // src/shared/lib/jwt.ts:

// import jwt from 'jsonwebtoken';
// import { config } from '../../config';

// export interface JwtPayload {
//   userId: string;
//   email: string;
// }

// export const signToken = (payload: JwtPayload): string => {
//   return jwt.sign(payload, config.JWT_SECRET, {
//     expiresIn: config.JWT_EXPIRES_IN,
//   });
// };

// export const verifyToken = (token: string): JwtPayload => {
//   return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
// };

// export const signRefreshToken = (payload: JwtPayload): string => {
//   return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
//     expiresIn: config.JWT_REFRESH_EXPIRES_IN,
//   });
// };

// export const verifyRefreshToken = (token: string): JwtPayload => {
//   return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
// };