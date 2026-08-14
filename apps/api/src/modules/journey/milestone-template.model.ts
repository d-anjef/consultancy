import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface MilestoneTemplateItem {
  key: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedDays?: number;
}

export interface MilestoneTemplateDocument extends Document {
  visaCategory: Types.ObjectId;
  name: string;
  description?: string;
  milestones: MilestoneTemplateItem[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneItemSchema = new Schema<MilestoneTemplateItem>(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 0 },
    isRequired: { type: Boolean, default: true },
    estimatedDays: { type: Number, min: 0 },
  },
  { _id: false },
);

const milestoneTemplateSchema = new Schema<MilestoneTemplateDocument>(
  {
    visaCategory: {
      type: Schema.Types.ObjectId,
      ref: 'VisaCategory',
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    milestones: {
      type: [milestoneItemSchema],
      required: true,
      default: [],
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'milestone_templates' },
);

export const MilestoneTemplateModel: Model<MilestoneTemplateDocument> =
  mongoose.models.MilestoneTemplate ||
  mongoose.model<MilestoneTemplateDocument>('MilestoneTemplate', milestoneTemplateSchema);