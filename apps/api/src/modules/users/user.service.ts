import { Types } from 'mongoose';
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdateOwnProfileDto,
  ListUsersQueryDto,
} from '@consultancy/validators';
import { extractId } from '../../lib/mongo.js';
import {
  ROLE_CODES,
  ORGANIZATION_WIDE_ROLE_CODES,
  PERMISSION_CODES,
  type RoleCode,
  type PermissionCode,
} from '@consultancy/config';
import { INVITATION_EXPIRY_MS } from '@consultancy/config';
import { userRepository } from './user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { branchRepository } from '../branches/branch.repository.js';
import { teacherRepository } from '../teachers/teacher.repository.js';
import type { UserDocument } from './user.model.js';
import type { RoleDocument } from '../roles/role.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import { hashPassword, generateSecureToken } from '../../lib/crypto.js';
import { generateTeacherId } from '../../lib/studentId.js';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import { emailService } from '../auth/email.service.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedUser {
  id: string;
  email: string;
  role: {
    id: string;
    code: string;
    displayName: string;
  };
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    profilePhotoUrl?: string;
  };
  status: string;
  emailVerified: boolean;
  mfa: {
    enabled: boolean;
    method?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersResponse {
  items: FormattedUser[];
  pagination: PaginationMeta;
}

/**
 * Maps a role code to the specific CREATE_USER_* permission that governs
 * whether the actor may create/manage a user of that role.
 */
const ROLE_CREATE_PERMISSION_MAP: Record<RoleCode, PermissionCode | null> = {
  [ROLE_CODES.SUPER_ADMIN]: null, // Only Super Admin (already Super Admin) can create
  [ROLE_CODES.ADMIN]: PERMISSION_CODES.CREATE_USER_ADMIN,
  [ROLE_CODES.BRANCH_MANAGER]: PERMISSION_CODES.CREATE_USER_BRANCH_MANAGER,
  [ROLE_CODES.COUNSELOR]: PERMISSION_CODES.CREATE_USER_COUNSELOR,
  [ROLE_CODES.RECEPTIONIST]: PERMISSION_CODES.CREATE_USER_RECEPTIONIST,
  [ROLE_CODES.TEACHER]: PERMISSION_CODES.CREATE_USER_TEACHER,
  [ROLE_CODES.STUDENT]: PERMISSION_CODES.CREATE_USER_STUDENT,
};

export class UserService {
  async listUsers(
    query: ListUsersQueryDto,
    actor: { role: string; branch: string | null; permissions: string[] },
  ): Promise<ListUsersResponse> {
    let branchFilter = query.branchId;
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role as RoleCode);

    if (!isOrgWide) {
      branchFilter = actor.branch ?? undefined;
    }

    let roleId: string | undefined;
    if (query.roleCode) {
      const role = await roleRepository.findByCodeWithoutPopulate(query.roleCode);
      if (role) roleId = String(role._id);
    }

    const { items, pagination } = await userRepository.list(
      {
        search: query.search,
        roleId,
        branchId: branchFilter,
        status: query.status,
      },
      query.page,
      query.limit,
    );

    return {
      items: items.map((u) => this.formatUser(u)),
      pagination,
    };
  }

  async getUserById(id: string): Promise<FormattedUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return this.formatUser(user);
  }

  async createUser(
    data: CreateUserDto,
    actor: { id: string; role: string; branch: string | null; permissions: string[] },
  ): Promise<FormattedUser> {
    // 1. Check email uniqueness
    const emailExists = await userRepository.existsByEmail(data.email);
    if (emailExists) {
      throw new ConflictError(`A user with email "${data.email}" already exists`);
    }

    // 2. Verify role exists
    const role = await roleRepository.findByCode(data.roleCode);
    if (!role) {
      throw new NotFoundError('Role', data.roleCode);
    }

    // 3. Check actor's permission to create this role
    const requiredPermission = ROLE_CREATE_PERMISSION_MAP[data.roleCode as RoleCode];
    if (!requiredPermission) {
      throw new ForbiddenError(`Cannot create users with role: ${data.roleCode}`);
    }
    if (!actor.permissions.includes(requiredPermission)) {
      throw new ForbiddenError(
        `You do not have permission to create users with role: ${data.roleCode}`,
      );
    }

    // 4. Determine branch assignment
    const isTargetOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(
      data.roleCode as RoleCode,
    );
    let branchId: Types.ObjectId | undefined;

    if (!isTargetOrgWide) {
      // Non-org-wide roles must have a branch
      const isActorOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(
        actor.role as RoleCode,
      );

      if (isActorOrgWide) {
        // Org-wide actor must specify branchId
        if (!data.branchId) {
          throw new BusinessRuleError('Branch is required for this role');
        }
        const branch = await branchRepository.findById(data.branchId);
        if (!branch) {
          throw new NotFoundError('Branch', data.branchId);
        }
        branchId = branch._id as Types.ObjectId;
      } else {
        // Branch-scoped actor: force their own branch
        if (!actor.branch) {
          throw new ForbiddenError('You must be assigned to a branch to create users');
        }
        branchId = new Types.ObjectId(actor.branch);
      }
    }

    // 5. Generate temporary password + invitation token
    const tempPassword = generateSecureToken(16);
    const passwordHash = await hashPassword(tempPassword);
    const invitationToken = generateSecureToken(32);
    const invitationExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

    // 6. Create user
    const created = await userRepository.create({
      email: data.email,
      passwordHash,
      role: role._id as Types.ObjectId,
      branch: branchId,
      profile: {
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        phone: data.profile.phone,
      },
      status: 'PENDING_ACTIVATION',
      emailVerified: false,
      invitedBy: new Types.ObjectId(actor.id),
      invitationToken,
      invitationExpiresAt,
      createdBy: new Types.ObjectId(actor.id),
      mustChangePassword: true,
    });

    // 6b. Auto-create teacher_profile if role is TEACHER
    if (data.roleCode === ROLE_CODES.TEACHER && branchId) {
      try {
        const employeeId = await generateTeacherId();
        await teacherRepository.create({
          userId: created._id as Types.ObjectId,
          branch: branchId,
          employeeId,
          qualification: undefined,
          specialization: [],
          experienceYears: undefined,
          employmentType: 'FULL_TIME',
          joinedDate: new Date(),
          bio: undefined,
          createdBy: new Types.ObjectId(actor.id),
        });
        console.log(
          `[UserService] Auto-created teacher_profile ${employeeId} for user ${created.email}`,
        );
      } catch (err) {
        console.error(
          '[UserService] Failed to auto-create teacher_profile (non-blocking):',
          err,
        );
        // User still created — admin can manually create teacher profile later
      }
    }

    // 7. Send invitation email (non-blocking — log error but don't fail user creation)
    if (data.sendInvitation !== false) {
      try {
        await emailService.sendInvitationEmail({
          to: data.email,
          recipientName: `${data.profile.firstName} ${data.profile.lastName}`,
          invitationToken,
          roleName: role.displayName,
        });
      } catch (err) {
        console.error('[UserService] Invitation email failed (non-blocking):', err);
        // User is still created — admin can resend invitation later
      }
    }

    return this.formatUser(created);
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    actor: { id: string; role: string; branch: string | null },
  ): Promise<FormattedUser> {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError('User', id);

    const isActorOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(
      actor.role as RoleCode,
    );

    // Branch-scoped actors can only edit users in their branch
    if (!isActorOrgWide) {
      if (!actor.branch) {
        throw new ForbiddenError('You must be assigned to a branch');
      }
      if (!existing.branch || extractId(existing.branch) !== actor.branch) {
        throw new ForbiddenError('You cannot edit users outside your branch');
      }
    }

    // Branch change (only org-wide actors)
    let newBranchId: Types.ObjectId | undefined;
    if (data.branchId !== undefined) {
      if (!isActorOrgWide) {
        throw new ForbiddenError('Only Admins can transfer users between branches');
      }
      if (data.branchId) {
        const branch = await branchRepository.findById(data.branchId);
        if (!branch) throw new NotFoundError('Branch', data.branchId);
        newBranchId = branch._id as Types.ObjectId;
      }
    }

    const updated = await userRepository.update(id, {
      profile: data.profile
        ? {
            ...data.profile,
            dateOfBirth: data.profile.dateOfBirth
              ? new Date(data.profile.dateOfBirth)
              : undefined,
          }
        : undefined,
      branch: newBranchId,
      status: data.status,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('User', id);
    return this.formatUser(updated);
  }

  async updateOwnProfile(
    userId: string,
    data: UpdateOwnProfileDto,
  ): Promise<FormattedUser> {
    const updated = await userRepository.update(userId, {
      profile: data,
      updatedBy: new Types.ObjectId(userId),
    });
    if (!updated) throw new NotFoundError('User', userId);
    return this.formatUser(updated);
  }

  async deactivateUser(id: string, actorId: string): Promise<FormattedUser> {
    if (id === actorId) {
      throw new BusinessRuleError('You cannot deactivate your own account');
    }

    const updated = await userRepository.update(id, {
      status: 'INACTIVE',
      updatedBy: new Types.ObjectId(actorId),
    });
    if (!updated) throw new NotFoundError('User', id);
    return this.formatUser(updated);
  }

  async activateUser(id: string, actorId: string): Promise<FormattedUser> {
    const updated = await userRepository.update(id, {
      status: 'ACTIVE',
      updatedBy: new Types.ObjectId(actorId),
    });
    if (!updated) throw new NotFoundError('User', id);
    return this.formatUser(updated);
  }

  async resendInvitation(id: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User', id);

    if (user.status !== 'PENDING_ACTIVATION') {
      throw new BusinessRuleError('User is not pending activation');
    }

    const role = user.role as unknown as RoleDocument;

    const invitationToken = generateSecureToken(32);
    const invitationExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

    await userRepository.setInvitationToken(id, invitationToken, invitationExpiresAt);

    await emailService.sendInvitationEmail({
      to: user.email,
      recipientName: `${user.profile.firstName} ${user.profile.lastName}`,
      invitationToken,
      roleName: role.displayName,
    });
  }

  
  async adminSetPassword(
  id: string,
  input: { password?: string; sendEmail?: boolean },
): Promise<{ user: FormattedUser; plainPassword: string; emailSent: boolean }> {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User', id);

  // Auto-generate strong password if not provided
  // Format: X4kA-9mQz-Rn7T (readable, 14 chars, meets password policy)
  const plainPassword = input.password ?? this.generateFriendlyPassword();

  // Validate against policy (10+ chars, upper, lower, number, special)
  const policyCheck = this.validatePasswordPolicy(plainPassword);
  if (!policyCheck.valid) {
    throw new BusinessRuleError(policyCheck.message);
  }

  const passwordHash = await hashPassword(plainPassword);

  // Update user: set password, activate, clear invitation token
  await userRepository.updatePassword(id, passwordHash);
  await userRepository.update(id, {
    status: 'ACTIVE',
    emailVerified: true,
    emailVerifiedAt: new Date(),
  } as never);

  const updated = await userRepository.findById(id);
  if (!updated) throw new NotFoundError('User', id);
  const role = updated.role as unknown as RoleDocument;

  // Send email with credentials (non-blocking)
  let emailSent = false;
  if (input.sendEmail !== false) {
    try {
      await emailService.sendCredentialsEmail({
        to: updated.email,
        recipientName: `${updated.profile.firstName} ${updated.profile.lastName}`,
        email: updated.email,
        password: plainPassword,
        roleName: role.displayName,
      });
      emailSent = true;
    } catch {
      // Non-blocking — admin still gets password from response
      emailSent = false;
    }
  }

  return {
    user: this.formatUser(updated),
    plainPassword,
    emailSent,
  };
}

private generateFriendlyPassword(): string {
  // 14 chars: 3 groups of 4 separated by dashes
  // Guaranteed to meet 10+ chars, upper, lower, number, special
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const pool = upper + lower + nums;

  function pick(chars: string, n: number): string {
    let out = '';
    for (let i = 0; i < n; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  // Ensure at least 1 upper, 1 lower, 1 number, 1 special
  const guaranteed = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
    '!@#$%&'[Math.floor(Math.random() * 6)],
  ];

  const random = pick(pool, 8).split('');
  const shuffled = [...guaranteed, ...random].sort(() => Math.random() - 0.5).join('');
  // Format: XXXX-XXXX-XXXX for readability
  return `${shuffled.slice(0, 4)}-${shuffled.slice(4, 8)}-${shuffled.slice(8, 12)}`;
}

private validatePasswordPolicy(password: string): { valid: boolean; message: string } {
  if (password.length < 10) return { valid: false, message: 'Password must be at least 10 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: 'Password must contain a special character' };
  return { valid: true, message: 'OK' };
}

  formatUser(user: UserDocument): FormattedUser {
    const role = user.role as unknown as RoleDocument;
    const branch = user.branch as unknown as BranchDocument | undefined;

    return {
      id: String(user._id),
      email: user.email,
      role: {
        id: String(role._id),
        code: role.code,
        displayName: role.displayName,
      },
      branch: branch
        ? {
            id: String(branch._id),
            code: branch.code,
            name: branch.name,
          }
        : null,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        profilePhotoUrl: user.profile.profilePhotoUrl,
      },
      status: user.status,
      emailVerified: user.emailVerified,
      mfa: {
        enabled: user.mfa.enabled,
        method: user.mfa.method,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService();