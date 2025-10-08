import { Router, Request, Response } from 'express';
import Joi from 'joi';
import authService from '../services/authService';
import { authMiddleware, generateToken } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      throw createApiError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { email, username, password } = value;
    const result = await authService.register(email, username, password);

    res.status(201).json({
      message: 'User registered successfully',
      token: result.token,
      user: {
        id: result.user._id,
        email: result.user.email,
        username: result.user.username,
      },
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      throw createApiError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { email, password } = value;
    const result = await authService.login(email, password);

    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: {
        id: result.user._id,
        email: result.user.email,
        username: result.user.username,
      },
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  logger.info(`User logged out: ${req.email}`);
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw createApiError('User ID not found in token', 401, 'INVALID_TOKEN');
    }

    const user = await authService.getUserById(req.userId);

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    throw error;
  }
});

export default router;
