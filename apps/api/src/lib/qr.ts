import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { QR_TOKEN_LENGTH } from '@consultancy/config';

export function generateQrToken(): string {
  return crypto.randomBytes(QR_TOKEN_LENGTH).toString('hex');
}

export function createQrPayload(
  userId: string,
  userType: 'STUDENT' | 'TEACHER',
  token: string,
): string {
  const payload = {
    sub: userId,
    type: userType,
    token,
    iat: Math.floor(Date.now() / 1000),
  };

  const signOptions: SignOptions = {
    expiresIn: env.JWT_QR_EXPIRY as unknown as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET as Secret, signOptions);
}

export function verifyQrPayload(
  payload: string,
): { sub: string; type: 'STUDENT' | 'TEACHER'; token: string } | null {
  try {
    const decoded = jwt.verify(payload, env.JWT_SECRET) as {
      sub: string;
      type: 'STUDENT' | 'TEACHER';
      token: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}