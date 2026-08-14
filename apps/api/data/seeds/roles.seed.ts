import type { Types } from 'mongoose';
import {
  ROLE_CODES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  ALL_ROLE_CODES,
  type RoleCode,
} from '@consultancy/config';
import { roleRepository } from '../../src/modules/roles/role.repository.js';
import { permissionRepository } from '../../src/modules/permissions/permission.repository.js';
import { logger } from '../../src/lib/logger.js';

export async function seedRoles(): Promise<void> {
  logger.info('Seeding system roles...');

  for (const roleCode of ALL_ROLE_CODES) {
    const permissionCodes = ROLE_PERMISSIONS[roleCode] || [];

    const permissionDocs = await permissionRepository.findByCodes(permissionCodes);

    if (permissionDocs.length !== permissionCodes.length) {
      const foundCodes = new Set(permissionDocs.map((p) => p.code));
      const missing = permissionCodes.filter((c) => !foundCodes.has(c));
      logger.warn(
        { role: roleCode, missing },
        'Some permissions not found for role — did permissions seed run first?',
      );
    }

    const permissionIds = permissionDocs.map((p) => p._id as Types.ObjectId);

    await roleRepository.upsertSystemRole({
      code: roleCode,
      displayName: ROLE_DISPLAY_NAMES[roleCode],
      description: ROLE_DESCRIPTIONS[roleCode],
      permissions: permissionIds,
      isSystem: true,
    });

    logger.info(
      `✓ Seeded role: ${roleCode} (${ROLE_DISPLAY_NAMES[roleCode]}) — ${permissionIds.length} permissions`,
    );
  }

  const total = await roleRepository.count();
  logger.info(`✓ Total roles in DB: ${total}`);
}

export function getSystemRoleCodes(): RoleCode[] {
  return [
    ROLE_CODES.SUPER_ADMIN,
    ROLE_CODES.ADMIN,
    ROLE_CODES.BRANCH_MANAGER,
    ROLE_CODES.COUNSELOR,
    ROLE_CODES.RECEPTIONIST,
    ROLE_CODES.TEACHER,
    ROLE_CODES.STUDENT,
  ];
}