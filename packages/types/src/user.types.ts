import type { EntityId } from './common.types.js';

type RoleCode = string;
type UserStatus = string;

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface UserMfa {
  enabled: boolean;
  method?: 'TOTP' | 'EMAIL_OTP' | 'SMS_OTP';
}

export interface AuthenticatedUser {
  id: EntityId;
  email: string;
  role: {
    id: EntityId;
    code: RoleCode;
    displayName: string;
  };
  branch: {
    id: EntityId;
    code: string;
    name: string;
  } | null;
  profile: UserProfile;
  status: UserStatus;
  emailVerified: boolean;
  mfa: UserMfa;
  permissions: string[];
}

export interface CreateUserInput {
  email: string;
  roleCode: RoleCode;
  branchId?: EntityId;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  sendInvitation?: boolean;
}

export interface UpdateUserInput {
  profile?: Partial<UserProfile>;
  branchId?: EntityId;
  status?: UserStatus;
}