import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface RoleDocument extends Document {
  code: string;
  displayName: string;
  description?: string;
  permissions: Types.ObjectId[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<RoleDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        required: true,
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'roles',
  },
);

export const RoleModel: Model<RoleDocument> =
  mongoose.models.Role || mongoose.model<RoleDocument>('Role', roleSchema);