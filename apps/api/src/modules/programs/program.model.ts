import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface ProgramDocument extends Document {
  code: string;
  name: string;
  description?: string;
  type: 'LANGUAGE_SCHOOL' | 'UNIVERSITY' | 'VOCATIONAL' | 'WORKING' | 'OTHER';
  durationMonths?: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const programSchema = new Schema<ProgramDocument>(
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
    type: {
      type: String,
      required: true,
      enum: ['LANGUAGE_SCHOOL', 'UNIVERSITY', 'VOCATIONAL', 'WORKING', 'OTHER'],
      index: true,
    },
    durationMonths: { type: Number, min: 1, max: 120 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'programs' },
);

export const ProgramModel: Model<ProgramDocument> =
  mongoose.models.Program || mongoose.model<ProgramDocument>('Program', programSchema);