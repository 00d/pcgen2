import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

export async function initializeRedis(): Promise<RedisClientType> {
  try {
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
    logger.info('Redis initialized successfully');

    return redisClient;
  } catch (error) {
    logger.error('Redis initialization error:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
}

// Cache helpers
export async function getCachedData<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedData<T>(key: string, data: T, ttl: number = 86400): Promise<void> {
  const client = getRedisClient();
  await client.setEx(key, ttl, JSON.stringify(data));
}

export async function deleteCachedData(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export default redisClient;
