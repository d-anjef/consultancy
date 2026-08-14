import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface VisaCategoryDocument extends Document {
  code: string;
  name: string;
  description?: string;
  requiredDocumentTypes?: string[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const visaCategorySchema = new Schema<VisaCategoryDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    requiredDocumentTypes: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'visa_categories' },
);

export const VisaCategoryModel: Model<VisaCategoryDocument> =
  mongoose.models.VisaCategory ||
  mongoose.model<VisaCategoryDocument>('VisaCategory', visaCategorySchema);