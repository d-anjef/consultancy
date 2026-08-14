import { env } from '../config/env.js';
import { logger } from './lib/logger.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { createRedisClient, disconnectRedis } from '../config/redis.js';
import { configureCloudinary } from '../config/cloudinary.js';
import { closeAllQueues } from './jobs/queue.js';
import { createApp } from './app.js';

async function bootstrap(): Promise<void> {
  logger.info({
    environment: env.NODE_ENV,
    port: env.PORT,
    timezone: env.ORG_TIMEZONE,
    currency: env.ORG_CURRENCY,
  }, 'Starting server...');

  // ─── Connect to services ─────
  await connectDatabase();
  createRedisClient();
  configureCloudinary();

  // ─── Create Express app ─────
  const app = createApp();

  // ─── Start listening ─────
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running at ${env.API_BASE_URL}`);
    logger.info(`Health check at ${env.API_BASE_URL}/api/health`);
    logger.info(`API at ${env.API_BASE_URL}/api/${env.API_VERSION}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // ─── Graceful Shutdown ─────
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info({ signal }, 'Received shutdown signal');

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closeAllQueues();
          await disconnectRedis();
          await disconnectDatabase();
          logger.info('All connections closed. Exiting.');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown — timeout exceeded');
        process.exit(1);
      }, 30000);
    });
  }

  // ─── Unhandled Errors ─────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.fatal({ error }, 'Uncaught Exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to start server');
  process.exit(1);
});