import { PERMISSION_METADATA, ALL_PERMISSION_CODES } from '@consultancy/config';
import { permissionRepository } from '../../src/modules/permissions/permission.repository.js';
import { logger } from '../../src/lib/logger.js';

export async function seedPermissions(): Promise<void> {
  logger.info('Seeding permissions...');

  const permissions = ALL_PERMISSION_CODES.map((code) => {
    const metadata = PERMISSION_METADATA[code];
    return {
      code,
      category: metadata.category,
      description: metadata.description,
    };
  });

  await permissionRepository.upsertMany(permissions);

  const total = await permissionRepository.count();
  logger.info(`✓ Seeded ${permissions.length} permissions (total in DB: ${total})`);
}