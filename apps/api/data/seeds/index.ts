import { seedPermissions } from './permissions.seed.js';
import { seedRoles } from './roles.seed.js';
import { seedBranches } from './branches.seed.js';
import { seedSuperAdmin } from './super-admin.seed.js';
import { seedPrograms } from './programs.seed.js';
import { seedVisaCategories } from './visa-categories.seed.js';
import { logger } from '../../src/lib/logger.js';

export async function runAllSeeds(): Promise<void> {
  logger.info('');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  Chiba Education Center — Database Seed');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('');

  try {
    await seedPermissions();
    await seedRoles();
    const superAdminId = await seedSuperAdmin();
    await seedBranches(superAdminId);
    await seedPrograms(superAdminId);
    await seedVisaCategories(superAdminId);

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('  ✓ ALL SEEDS COMPLETED SUCCESSFULLY');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
  } catch (error) {
    logger.error({ error }, '✗ Seed failed');
    throw error;
  }
}

export { seedPermissions, seedRoles, seedBranches, seedSuperAdmin, seedPrograms, seedVisaCategories };