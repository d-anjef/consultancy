import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { ROLE_CODES } from '@consultancy/config';
import { UserModel } from '../../src/modules/users/user.model.js';
import { roleRepository } from '../../src/modules/roles/role.repository.js';
import { hashPassword } from '../../src/lib/crypto.js';
import { logger } from '../../src/lib/logger.js';

export async function seedSuperAdmin(): Promise<Types.ObjectId> {
  logger.info('Seeding Super Admin user...');

  if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
    throw new Error(
      'SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env before seeding',
    );
  }

  if (env.SUPER_ADMIN_PASSWORD.length < 10) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 10 characters long');
  }

  const superAdminRole = await roleRepository.findByCodeWithoutPopulate(
    ROLE_CODES.SUPER_ADMIN,
  );

  if (!superAdminRole) {
    throw new Error(
      'Super Admin role not found. Ensure roles are seeded before running Super Admin seed.',
    );
  }

  const existing = await UserModel.findOne({
    email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
  }).lean();

  if (existing) {
    logger.warn(
      `- Super Admin already exists (${env.SUPER_ADMIN_EMAIL}) — skipping creation`,
    );
    return existing._id as Types.ObjectId;
  }

  const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

  const superAdmin = await UserModel.create({
    email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: superAdminRole._id as Types.ObjectId,
    profile: {
      firstName: env.SUPER_ADMIN_FIRST_NAME,
      lastName: env.SUPER_ADMIN_LAST_NAME,
      phone: '+9770000000',
    },
    status: 'ACTIVE',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    mfa: { enabled: false },
    security: {
      failedLoginAttempts: 0,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  logger.info('');
  logger.info('╔═══════════════════════════════════════════════════════════╗');
  logger.info('║           SUPER ADMIN CREATED SUCCESSFULLY                ║');
  logger.info('╠═══════════════════════════════════════════════════════════╣');
  logger.info(`║  Email:    ${env.SUPER_ADMIN_EMAIL.padEnd(46)} ║`);
  logger.info(`║  Password: ${env.SUPER_ADMIN_PASSWORD.padEnd(46)} ║`);
  logger.info('║                                                           ║');
  logger.info('║  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN   ║');
  logger.info('╚═══════════════════════════════════════════════════════════╝');
  logger.info('');

  return superAdmin._id as Types.ObjectId;
}