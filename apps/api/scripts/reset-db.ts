import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../src/lib/logger.js';
import { env } from '../config/env.js';

async function main(): Promise<void> {
  if (env.isProduction) {
    logger.fatal('DANGER: reset-db cannot be run in production');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    logger.warn('');
    logger.warn(`This will DELETE ALL DATA in the database: ${env.MONGODB_DB_NAME}`);
    logger.warn('');
    logger.warn('To proceed, run with the --confirm flag:');
    logger.warn('  pnpm --filter @consultancy/api exec tsx scripts/reset-db.ts --confirm');
    logger.warn('');
    process.exit(0);
  }

  try {
    logger.info(`Connecting to database: ${env.MONGODB_DB_NAME}`);
    await connectDatabase();

    logger.warn('Dropping all collections...');
    const collections = mongoose.connection.collections;
    for (const name in collections) {
      await collections[name]!.deleteMany({});
      logger.info(`  ✓ Cleared: ${name}`);
    }

    await disconnectDatabase();
    logger.info('✓ Database reset complete. Run `pnpm seed` to reseed.');
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, '✗ Reset failed');
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

main();