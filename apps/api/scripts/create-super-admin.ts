import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { seedPermissions } from '../data/seeds/permissions.seed.js';
import { seedRoles } from '../data/seeds/roles.seed.js';
import { seedSuperAdmin } from '../data/seeds/super-admin.seed.js';
import { logger } from '../src/lib/logger.js';

async function main(): Promise<void> {
  try {
    logger.info('Connecting to database...');
    await connectDatabase();

    logger.info('Ensuring permissions exist...');
    await seedPermissions();

    logger.info('Ensuring roles exist...');
    await seedRoles();

    logger.info('Creating Super Admin...');
    await seedSuperAdmin();

    await disconnectDatabase();
    logger.info('✓ Super Admin creation completed');
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, '✗ Super Admin creation failed');
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

main();