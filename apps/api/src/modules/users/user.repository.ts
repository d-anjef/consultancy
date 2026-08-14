import { Types, type FilterQuery } from 'mongoose';
import { UserModel, type UserDocument } from './user.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Types.ObjectId;
  branch?: Types.ObjectId;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
  emailVerified?: boolean;
  invitedBy?: Types.ObjectId;
  invitationToken?: string;
  invitationExpiresAt?: Date;
  createdBy?: Types.ObjectId;
  mustChangePassword?: boolean;
}

export interface UpdateUserData {
  profile?: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    profilePhotoUrl: string;
    dateOfBirth: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
  }>;
  branch?: Types.ObjectId;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
  updatedBy?: Types.ObjectId;
}

export interface ListUsersFilter {
  search?: string;
  roleId?: string;
  branchId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
}

export interface ListUsersResult {
  items: UserDocument[];
  pagination: PaginationMeta;
}

/**
 * Standard populate config for user queries — includes role AND role permissions.
 */
const USER_POPULATE = [
  { path: 'role', populate: { path: 'permissions' } },
  { path: 'branch' },
];

export class UserRepository {
  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return UserModel.findById(id)
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();
  }

  async findByIdWithSecrets(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return UserModel.findById(id)
      .select('+passwordHash +mfa.secret +mfa.backupCodes')
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() })
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() })
      .select('+passwordHash +mfa.secret +mfa.backupCodes')
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();
  }

  async findByInvitationToken(token: string): Promise<UserDocument | null> {
    return UserModel.findOne({ invitationToken: token })
      .select('+invitationToken')
      .lean<UserDocument | null>();
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return UserModel.findOne({ passwordResetToken: token })
      .select('+passwordResetToken +passwordHash')
      .lean<UserDocument | null>();
  }

  async create(data: CreateUserData): Promise<UserDocument> {
    const user = await UserModel.create({
      ...data,
      email: data.email.toLowerCase(),
      security: {
        failedLoginAttempts: 0,
        mustChangePassword: data.mustChangePassword ?? false,
      },
    });

    const populated = await UserModel.findById(user._id)
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();

    if (!populated) {
      throw new Error('Failed to load created user');
    }
    return populated;
  }

  async update(id: string, data: UpdateUserData): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};

    if (data.profile) {
      for (const [k, v] of Object.entries(data.profile)) {
        if (v !== undefined) updateOps[`profile.${k}`] = v;
      }
    }
    if (data.branch !== undefined) updateOps.branch = data.branch;
    if (data.status !== undefined) updateOps.status = data.status;
    if (data.updatedBy !== undefined) updateOps.updatedBy = data.updatedBy;

    return UserModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: {
        passwordHash,
        'security.passwordChangedAt': new Date(),
        'security.mustChangePassword': false,
        'security.failedLoginAttempts': 0,
      },
      $unset: {
        passwordResetToken: '',
        passwordResetExpiresAt: '',
        'security.lockedUntil': '',
      },
    });
  }

  async setInvitationToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { invitationToken: token, invitationExpiresAt: expiresAt },
    });
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });
  }

  async activate(id: string, passwordHash: string): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          passwordHash,
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          'security.passwordChangedAt': new Date(),
          'security.mustChangePassword': false,
        },
        $unset: {
          invitationToken: '',
          invitationExpiresAt: '',
        },
      },
      { new: true },
    )
      .populate(USER_POPULATE)
      .lean<UserDocument | null>();
  }

  async recordSuccessfulLogin(id: string, ipAddress: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: {
        'security.lastLoginAt': new Date(),
        'security.lastLoginIp': ipAddress,
        'security.failedLoginAttempts': 0,
      },
      $unset: {
        'security.lockedUntil': '',
      },
    });
  }

  async incrementFailedLoginAttempts(id: string): Promise<number> {
    const result = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { 'security.failedLoginAttempts': 1 } },
      { new: true },
    ).lean<UserDocument | null>();
    return result?.security.failedLoginAttempts || 0;
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { 'security.lockedUntil': until },
    });
  }

  async updateMfa(
    id: string,
    mfa: {
      enabled: boolean;
      method?: 'TOTP' | 'EMAIL_OTP' | 'SMS_OTP';
      secret?: string;
      backupCodes?: string[];
    },
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { mfa } });
  }

  async list(
    filter: ListUsersFilter,
    page: number,
    limit: number,
  ): Promise<ListUsersResult> {
    const query: FilterQuery<UserDocument> = {};

    if (filter.roleId && Types.ObjectId.isValid(filter.roleId)) {
      query.role = new Types.ObjectId(filter.roleId);
    }
    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.search) {
      const s = filter.search.trim();
      query.$or = [
        { email: { $regex: s, $options: 'i' } },
        { 'profile.firstName': { $regex: s, $options: 'i' } },
        { 'profile.lastName': { $regex: s, $options: 'i' } },
        { 'profile.phone': { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      UserModel.find(query)
        .populate(USER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<UserDocument[]>(),
      UserModel.countDocuments(query),
    ]);

    return {
      items,
      pagination: createPaginationMeta(page, limit, total),
    };
  }

  async count(): Promise<number> {
    return UserModel.countDocuments();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }
}

export const userRepository = new UserRepository();