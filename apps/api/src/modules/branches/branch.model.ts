import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface BranchAddress {
  street: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode?: string;
}

export interface BranchDocument extends Document {
  code: string;
  name: string;
  address: BranchAddress;
  phone: string;
  email: string;
  timezone: string;
  manager?: Types.ObjectId;
  isActive: boolean;
  metadata?: {
    establishedDate?: Date;
    capacity?: number;
  };
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<BranchAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'Nepal' },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
);

const branchSchema = new Schema<BranchDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Kathmandu',
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      establishedDate: { type: Date },
      capacity: { type: Number, min: 0 },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'branches',
  },
);

branchSchema.index({ isActive: 1, code: 1 });

export const BranchModel: Model<BranchDocument> =
  mongoose.models.Branch || mongoose.model<BranchDocument>('Branch', branchSchema);