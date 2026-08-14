import type {
  LoginDto,
  MfaVerifyDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ActivateAccountDto,
} from '@consultancy/validators';
import {
  ACCOUNT_LOCK_DURATION_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  PASSWORD_RESET_TOKEN_EXPIRY_MS,
} from '@consultancy/config';
import { userRepository } from '../users/user.repository.js';
import type { UserDocument } from '../users/user.model.js';
import type { RoleDocument } from '../roles/role.model.js';
import type { PermissionDocument } from '../permissions/permission.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import { hashPassword, verifyPassword, generateSecureToken } from '../../lib/crypto.js';
import { emailService } from './email.service.js';
import { mfaService } from './mfa.service.js';
import {
  BusinessRuleError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '../../lib/errors.js';
import type { SessionUser } from '../../middleware/authenticate.js';

export interface LoginResult {
  requiresMfa: boolean;
  mfaMethod?: 'TOTP' | 'EMAIL_OTP';
  mfaSessionToken?: string;
  sessionUser?: SessionUser;
}

export interface MfaVerifyResult {
  sessionUser: SessionUser;
}

export class AuthService {
  async login(data: LoginDto, ipAddress: string): Promise<LoginResult> {
    const user = await userRepository.findByEmailWithPassword(data.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      throw new ForbiddenError(
        'Your account is not active. Please contact your administrator.',
      );
    }

    if (user.status === 'PENDING_ACTIVATION') {
      throw new ForbiddenError(
        'Your account is not activated. Please check your email for the activation link.',
      );
    }

    if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.security.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenError(
        `Your account is locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      );
    }

    const isValidPassword = await verifyPassword(user.passwordHash, data.password);

    if (!isValidPassword) {
      const attempts = await userRepository.incrementFailedLoginAttempts(String(user._id));
      if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await userRepository.lockAccount(
          String(user._id),
          new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS),
        );
        throw new ForbiddenError(
          'Too many failed login attempts. Your account has been locked for 15 minutes.',
        );
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.mfa.enabled) {
      const mfaSessionToken = await mfaService.createMfaSessionToken(String(user._id));

      if (user.mfa.method === 'EMAIL_OTP') {
        const code = await mfaService.generateEmailOtp(String(user._id));
        await emailService.sendMfaCodeEmail({
          to: user.email,
          recipientName: `${user.profile.firstName} ${user.profile.lastName}`,
          code,
        });
      }

      return {
        requiresMfa: true,
        mfaMethod: user.mfa.method as 'TOTP' | 'EMAIL_OTP',
        mfaSessionToken,
      };
    }

    await userRepository.recordSuccessfulLogin(String(user._id), ipAddress);

    return {
      requiresMfa: false,
      sessionUser: this.buildSessionUser(user),
    };
  }

  async verifyMfa(data: MfaVerifyDto, ipAddress: string): Promise<MfaVerifyResult> {
    const userId = await mfaService.resolveMfaSessionToken(data.mfaSessionToken);
    if (!userId) {
      throw new UnauthorizedError('MFA session expired or invalid. Please log in again.');
    }

    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.mfa.enabled || !user.mfa.method) {
      throw new BusinessRuleError('MFA is not enabled for this account');
    }

    let isValid = false;

    if (user.mfa.method === 'TOTP' && user.mfa.secret) {
      const decryptedSecret = mfaService.decryptMfaSecret(user.mfa.secret);
      isValid = mfaService.verifyTotpCode(decryptedSecret, data.code);
    } else if (user.mfa.method === 'EMAIL_OTP') {
      isValid = await mfaService.verifyEmailOtp(String(user._id), data.code);
    }

    if (!isValid) {
      throw new UnauthorizedError('Invalid verification code');
    }

    await mfaService.consumeMfaSessionToken(data.mfaSessionToken);
    await userRepository.recordSuccessfulLogin(String(user._id), ipAddress);

    return {
      sessionUser: this.buildSessionUser(user),
    };
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(data.email);

    if (!user || user.status !== 'ACTIVE') return;

    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

    await userRepository.setPasswordResetToken(String(user._id), token, expiresAt);

    await emailService.sendPasswordResetEmail({
      to: user.email,
      recipientName: `${user.profile.firstName} ${user.profile.lastName}`,
      resetToken: token,
    });
  }

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    const user = await userRepository.findByPasswordResetToken(data.token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new UnauthorizedError('Reset token has expired. Please request a new one.');
    }

    const passwordHash = await hashPassword(data.newPassword);
    await userRepository.updatePassword(String(user._id), passwordHash);
  }

  async activateAccount(data: ActivateAccountDto): Promise<void> {
    const user = await userRepository.findByInvitationToken(data.token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired invitation token');
    }

    if (user.status !== 'PENDING_ACTIVATION') {
      throw new BusinessRuleError('This account is already activated');
    }

    if (
      !user.invitationExpiresAt ||
      user.invitationExpiresAt < new Date()
    ) {
      throw new UnauthorizedError(
        'Invitation has expired. Please contact your administrator to resend.',
      );
    }

    const passwordHash = await hashPassword(data.password);
    await userRepository.activate(String(user._id), passwordHash);
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const isValid = await verifyPassword(user.passwordHash, data.currentPassword);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await hashPassword(data.newPassword);
    await userRepository.updatePassword(userId, newHash);
  }

  async setupTotp(userId: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User', userId);

    const setup = await mfaService.generateTotpSetup(user.email);
    return setup;
  }

  async verifyAndEnableMfa(
    userId: string,
    method: 'TOTP' | 'EMAIL_OTP',
    secret: string,
    code: string,
    backupCodes?: string[],
  ): Promise<void> {
    const isValid = mfaService.verifyTotpCode(secret, code);
    if (!isValid) {
      throw new UnauthorizedError('Invalid verification code');
    }

    const encryptedSecret = mfaService.encryptMfaSecret(secret);
    const encryptedBackupCodes = backupCodes
      ? mfaService.encryptBackupCodes(backupCodes)
      : undefined;

    await userRepository.updateMfa(userId, {
      enabled: true,
      method,
      secret: encryptedSecret,
      backupCodes: encryptedBackupCodes,
    });
  }

  async disableMfa(userId: string, password: string): Promise<void> {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw new NotFoundError('User', userId);

    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedError('Password is incorrect');
    }

    await userRepository.updateMfa(userId, { enabled: false });
  }

  async getMe(userId: string): Promise<SessionUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return this.buildSessionUser(user);
  }

  buildSessionUser(user: UserDocument): SessionUser {
    const role = user.role as unknown as RoleDocument & {
      permissions: PermissionDocument[];
    };
    const branch = user.branch as unknown as BranchDocument | undefined;

    const permissionCodes: string[] = Array.isArray(role.permissions)
      ? role.permissions.map((p) =>
          typeof p === 'object' && p !== null && 'code' in p ? String(p.code) : String(p),
        )
      : [];

    return {
      id: String(user._id),
      email: user.email,
      role: {
        id: String(role._id),
        code: role.code,
        displayName: role.displayName,
        permissions: permissionCodes,
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
      },
      status: user.status,
    };
  }
}

export const authService = new AuthService();