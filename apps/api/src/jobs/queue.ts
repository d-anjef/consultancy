import { Queue, Worker, type Job, type WorkerOptions } from 'bullmq';
import { getRedisClient } from '../../config/redis.js';
import { logger } from '../lib/logger.js';
import { QUEUE_NAMES } from '@consultancy/config';
import { env } from '../../config/env.js';

const queues: Map<string, Queue> = new Map();
const workers: Map<string, Worker> = new Map();

export function getQueue(name: string): Queue {
  const existing = queues.get(name);
  if (existing) return existing;

  const redis = getRedisClient();

  const queue = new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 5000,
      },
      attempts: env.QUEUE_RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: env.QUEUE_RETRY_BACKOFF_MS,
      },
    },
  });

  queue.on('error', (error) => {
    logger.error({ queue: name, error }, 'Queue error');
  });

  queues.set(name, queue);
  logger.info({ queue: name }, 'Queue created');

  return queue;
}

export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>,
  options?: Partial<WorkerOptions>,
): Worker {
  const redis = getRedisClient();

  const worker = new Worker<T>(queueName, processor, {
    connection: redis,
    concurrency: options?.concurrency || 5,
    ...options,
  });

  worker.on('completed', (job) => {
    logger.debug({ queue: queueName, jobId: job.id, jobName: job.name }, 'Job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error(
      { queue: queueName, jobId: job?.id, jobName: job?.name, error },
      'Job failed',
    );
  });

  worker.on('error', (error) => {
    logger.error({ queue: queueName, error }, 'Worker error');
  });

  workers.set(queueName, worker);
  logger.info({ queue: queueName }, 'Worker created');

  return worker;
}

export function getNotificationQueue(): Queue {
  return getQueue(QUEUE_NAMES.NOTIFICATION);
}

export function getEmailQueue(): Queue {
  return getQueue(QUEUE_NAMES.EMAIL);
}

export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const [name, worker] of workers) {
    logger.info({ worker: name }, 'Closing worker');
    closePromises.push(worker.close());
  }

  for (const [name, queue] of queues) {
    logger.info({ queue: name }, 'Closing queue');
    closePromises.push(queue.close());
  }

  await Promise.allSettled(closePromises);
  workers.clear();
  queues.clear();
  logger.info('All queues and workers closed');
}