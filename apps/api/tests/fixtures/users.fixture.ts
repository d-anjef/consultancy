import { Types } from 'mongoose';
import type { RoleCode } from '@consultancy/config';
import { UserModel } from '../../src/modules/users/user.model.js';
import { roleRepository } from '../../src/modules/roles/role.repository.js';
import { hashPassword } from '../../src/lib/crypto.js';

export interface CreateTestUserOptions {
  email?: string;
  password?: string;
  roleCode: RoleCode;
  branchId?: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
}

export async function createTestUser(opts: CreateTestUserOptions) {
  const role = await roleRepository.findByCodeWithoutPopulate(opts.roleCode);
  if (!role) {
    throw new Error(`Role ${opts.roleCode} not found — seed roles first`);
  }

  const password = opts.password || 'TestPassword@123';
  const passwordHash = await hashPassword(password);

  const user = await UserModel.create({
    email: opts.email || `test-${Date.now()}@chibaeducation.com`,
    passwordHash,
    role: role._id as Types.ObjectId,
    branch: opts.branchId,
    profile: {
      firstName: opts.firstName || 'Test',
      lastName: opts.lastName || 'User',
      phone: '+9779999999',
    },
    status: opts.status || 'ACTIVE',
    emailVerified: true,
  });

  return { user, password };
}