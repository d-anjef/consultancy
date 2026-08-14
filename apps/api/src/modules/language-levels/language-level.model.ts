import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type ExamType = 'JLPT' | 'NAT' | 'CUSTOM';

export interface LanguageLevelDocument extends Document {
  code: string;
  name: string;
  description?: string;
  examType: ExamType;
  order: number;
  durationMonths?: number;
  prerequisiteId?: Types.ObjectId;
  fee?: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const languageLevelSchema = new Schema<LanguageLevelDocument>(
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
    examType: {
      type: String,
      required: true,
      enum: ['JLPT', 'NAT', 'CUSTOM'],
      default: 'JLPT',
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    durationMonths: { type: Number, min: 1, max: 60 },
    prerequisiteId: {
      type: Schema.Types.ObjectId,
      ref: 'LanguageLevel',
    },
    fee: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'language_levels' },
);

languageLevelSchema.index({ examType: 1, order: 1 });

export const LanguageLevelModel: Model<LanguageLevelDocument> =
  mongoose.models.LanguageLevel ||
  mongoose.model<LanguageLevelDocument>('LanguageLevel', languageLevelSchema);