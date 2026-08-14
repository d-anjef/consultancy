import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  profilePhotoUrl?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface UserMfa {
  enabled: boolean;
  method?: 'TOTP' | 'EMAIL_OTP' | 'SMS_OTP';
  secret?: string;
  backupCodes?: string[];
}

export interface UserSecurity {
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
}

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  role: Types.ObjectId;
  branch?: Types.ObjectId;
  profile: UserProfile;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  mfa: UserMfa;
  security: UserSecurity;
  invitedBy?: Types.ObjectId;
  invitationToken?: string;
  invitationExpiresAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<UserProfile>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    profilePhotoUrl: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
  },
  { _id: false },
);

const mfaSchema = new Schema<UserMfa>(
  {
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ['TOTP', 'EMAIL_OTP', 'SMS_OTP'] },
    secret: { type: String, select: false },
    backupCodes: { type: [String], select: false, default: undefined },
  },
  { _id: false },
);

const securitySchema = new Schema<UserSecurity>(
  {
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    passwordChangedAt: { type: Date },
    mustChangePassword: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    profile: {
      type: profileSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION'],
      default: 'PENDING_ACTIVATION',
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: { type: Date },
    mfa: {
      type: mfaSchema,
      default: () => ({ enabled: false }),
    },
    security: {
      type: securitySchema,
      default: () => ({
        failedLoginAttempts: 0,
        mustChangePassword: false,
      }),
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitationToken: {
      type: String,
      index: true,
      sparse: true,
      select: false,
    },
    invitationExpiresAt: { type: Date },
    passwordResetToken: {
      type: String,
      index: true,
      sparse: true,
      select: false,
    },
    passwordResetExpiresAt: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

userSchema.index({ role: 1, branch: 1 });
userSchema.index({ branch: 1, status: 1 });
userSchema.index({ status: 1, email: 1 });

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);