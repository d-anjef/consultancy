import { authenticator } from 'otplib';
import { env } from '../../../config/env.js';
import { generateQrCodeDataUrl } from '../../lib/qr.js';
import { encrypt, decrypt, generateNumericOtp, generateSecureToken } from '../../lib/crypto.js';
import { getRedisClient } from '../../../config/redis.js';
import { MFA_CODE_EXPIRY_MS } from '@consultancy/config';

export interface MfaSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export class MfaService {
  async generateTotpSetup(email: string): Promise<MfaSetupResult> {
    const secret = authenticator.generateSecret();

    const otpauth = authenticator.keyuri(email, env.MFA_ISSUER, secret);

    const qrCodeDataUrl = await generateQrCodeDataUrl(otpauth);

    const backupCodes = Array.from({ length: 10 }, () =>
      generateSecureToken(4).toUpperCase().slice(0, 8),
    );

    return { secret, qrCodeDataUrl, backupCodes };
  }

  verifyTotpCode(secret: string, code: string): boolean {
    try {
      return authenticator.verify({ token: code, secret });
    } catch {
      return false;
    }
  }

  encryptMfaSecret(secret: string): string {
    return encrypt(secret);
  }

  decryptMfaSecret(encryptedSecret: string): string {
    return decrypt(encryptedSecret);
  }

  encryptBackupCodes(codes: string[]): string[] {
    return codes.map((c) => encrypt(c));
  }

  async generateEmailOtp(userId: string): Promise<string> {
    const code = generateNumericOtp(6);
    const redis = getRedisClient();
    const key = `mfa:email_otp:${userId}`;
    await redis.set(key, code, 'PX', MFA_CODE_EXPIRY_MS);
    return code;
  }

  async verifyEmailOtp(userId: string, code: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `mfa:email_otp:${userId}`;
    const stored = await redis.get(key);
    if (!stored) return false;
    if (stored !== code) return false;
    await redis.del(key);
    return true;
  }

  async createMfaSessionToken(userId: string): Promise<string> {
    const token = generateSecureToken(32);
    const redis = getRedisClient();
    const key = `mfa:session:${token}`;
    await redis.set(key, userId, 'PX', 10 * 60 * 1000);
    return token;
  }

  async resolveMfaSessionToken(token: string): Promise<string | null> {
    const redis = getRedisClient();
    const key = `mfa:session:${token}`;
    return redis.get(key);
  }

  async consumeMfaSessionToken(token: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`mfa:session:${token}`);
  }
}

export const mfaService = new MfaService();