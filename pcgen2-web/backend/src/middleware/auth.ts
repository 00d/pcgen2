import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createApiError } from './errorHandler';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createApiError('Missing or invalid authorization header', 401, 'MISSING_AUTH');
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.userId = decoded.userId;
    req.email = decoded.email;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createApiError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createApiError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw createApiError('Authentication failed', 401, 'AUTH_FAILED');
  }
}

export function generateToken(userId: string, email: string): string {
  const expiresIn = process.env.JWT_EXPIRY || '7d';
  return jwt.sign({ userId, email }, jwtSecret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, jwtSecret) as JwtPayload;
}
