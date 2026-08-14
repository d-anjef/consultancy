import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { runAllSeeds } from '../data/seeds/index.js';
import { logger } from '../src/lib/logger.js';

async function main(): Promise<void> {
  try {
    logger.info('Connecting to database...');
    await connectDatabase();

    await runAllSeeds();

    logger.info('Disconnecting from database...');
    await disconnectDatabase();

    logger.info('✓ Seed script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, '✗ Seed script failed');
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

main();