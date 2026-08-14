import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface QRIdentityDocument extends Document {
  user: Types.ObjectId;
  userType: 'STUDENT' | 'TEACHER';
  token: string;
  qrPayload: string;
  issuedAt: Date;
  rotatedAt?: Date;
  isActive: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

const qrIdentitySchema = new Schema<QRIdentityDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ['STUDENT', 'TEACHER'],
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrPayload: { type: String, required: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    rotatedAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, trim: true },
  },
  { collection: 'qr_identities' },
);

export const QRIdentityModel: Model<QRIdentityDocument> =
  mongoose.models.QRIdentity ||
  mongoose.model<QRIdentityDocument>('QRIdentity', qrIdentitySchema);