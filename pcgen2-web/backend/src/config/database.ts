import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(mongodbUri, {
      retryWrites: true,
      w: 'majority',
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

export function disconnectDatabase(): Promise<void> {
  return mongoose.disconnect();
}

export default mongoose;
