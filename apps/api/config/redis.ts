import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../src/lib/logger.js';

let redisClient: Redis | null = null;

export function createRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times: number) {
      if (times > 10) {
        logger.error('Redis: Max retry attempts exceeded');
        return null;
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis: Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    ...(env.REDIS_TLS ? { tls: {} } : {}),
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('error', (error) => {
    logger.error({ error }, 'Redis client error');
  });

  redisClient.on('close', () => {
    logger.warn('Redis client connection closed');
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
}

export async function getRedisStatus(): Promise<{
  connected: boolean;
  latencyMs: number | null;
}> {
  if (!redisClient) {
    return { connected: false, latencyMs: null };
  }

  try {
    const start = Date.now();
    await redisClient.ping();
    const latencyMs = Date.now() - start;
    return { connected: true, latencyMs };
  } catch {
    return { connected: false, latencyMs: null };
  }
}