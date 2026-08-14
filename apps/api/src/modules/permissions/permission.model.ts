import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface PermissionDocument extends Document {
  code: string;
  category: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<PermissionDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'permissions',
  },
);

permissionSchema.index({ category: 1, code: 1 });

export const PermissionModel: Model<PermissionDocument> =
  mongoose.models.Permission ||
  mongoose.model<PermissionDocument>('Permission', permissionSchema);