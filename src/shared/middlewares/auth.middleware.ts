
// // src/shared/middlewares/auth.middleware.ts:

// import { Request, Response, NextFunction } from 'express';
// import { verifyToken } from '../shared/lib/jwt';
// import { AuthenticationError } from '../../shared/lib/errors';

// export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       throw new AuthenticationError('No token provided');
//     }
    
//     const token = authHeader.substring(7);
//     const decoded = verifyToken(token);
    
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(new AuthenticationError('Invalid or expired token'));
//   }
// };