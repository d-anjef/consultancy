import { Types } from 'mongoose';
import { QRIdentityModel, type QRIdentityDocument } from './qr-identity.model.js';
import { generateQrToken, createQrPayload, generateQrCodeDataUrl } from '../../lib/qr.js';


export class QRService {
  async getOrCreate(
    userId: string,
    userType: 'STUDENT' | 'TEACHER',
  ): Promise<{ token: string; qrPayload: string; qrCodeDataUrl: string }> {
    // Check existing
    let identity = await QRIdentityModel.findOne({
      user: new Types.ObjectId(userId),
      isActive: true,
    }).lean<QRIdentityDocument | null>();

    if (!identity) {
      // Create new
      const token = generateQrToken();
      const qrPayload = createQrPayload(userId, userType, token);

      identity = await QRIdentityModel.create({
        user: new Types.ObjectId(userId),
        userType,
        token,
        qrPayload,
        issuedAt: new Date(),
        isActive: true,
      });
    }

    const qrCodeDataUrl = await generateQrCodeDataUrl(identity.qrPayload);

    return {
      token: identity.token,
      qrPayload: identity.qrPayload,
      qrCodeDataUrl,
    };
  }

  async rotate(
    userId: string,
    userType: 'STUDENT' | 'TEACHER',
  ): Promise<{ token: string; qrPayload: string; qrCodeDataUrl: string }> {
    // Deactivate existing
    await QRIdentityModel.updateMany(
      { user: new Types.ObjectId(userId) },
      { $set: { isActive: false, revokedAt: new Date(), revokedReason: 'Rotated' } },
    );

    // Create new
    const token = generateQrToken();
    const qrPayload = createQrPayload(userId, userType, token);

    await QRIdentityModel.create({
      user: new Types.ObjectId(userId),
      userType,
      token,
      qrPayload,
      issuedAt: new Date(),
      rotatedAt: new Date(),
      isActive: true,
    });

    const qrCodeDataUrl = await generateQrCodeDataUrl(qrPayload);

    return { token, qrPayload, qrCodeDataUrl };
  }
}

export const qrService = new QRService();