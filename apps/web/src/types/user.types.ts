import type { RoleCode, PermissionCode } from '@consultancy/config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: {
    id: string;
    code: RoleCode;
    displayName: string;
    permissions: PermissionCode[];
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
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
}

export interface LoginResponse {
  requiresMfa: boolean;
  mfaMethod?: 'TOTP' | 'EMAIL_OTP' | 'SMS_OTP';
  mfaSessionToken?: string;
  user?: AuthenticatedUser;
}

export interface MfaVerifyResponse {
  user: AuthenticatedUser;
}