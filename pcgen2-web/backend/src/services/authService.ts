import { User, IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthService {
  async register(email: string, username: string, password: string): Promise<{ token: string; user: IUser }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        throw createApiError('User with this email or username already exists', 409, 'USER_EXISTS');
      }

      // Create new user
      const user = new User({
        email,
        username,
        passwordHash: password, // Will be hashed by pre-save middleware
      });

      await user.save();
      logger.info(`New user registered: ${email}`);

      const token = generateToken(user._id.toString(), user.email);

      return {
        token,
        user: {
          ...user.toObject(),
          passwordHash: undefined, // Don't send password hash
        } as any,
      };
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Registration error:', error);
      throw createApiError('Registration failed', 500);
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw createApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw createApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const token = generateToken(user._id.toString(), user.email);
      logger.info(`User logged in: ${email}`);

      return {
        token,
        user: {
          ...user.toObject(),
          passwordHash: undefined,
        } as any,
      };
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Login error:', error);
      throw createApiError('Login failed', 500);
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw createApiError('User not found', 404, 'USER_NOT_FOUND');
      }

      return {
        ...user.toObject(),
        passwordHash: undefined,
      } as any;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Get user error:', error);
      throw createApiError('Failed to get user', 500);
    }
  }
}

export default new AuthService();
