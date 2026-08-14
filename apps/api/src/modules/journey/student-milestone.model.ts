import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface StudentMilestoneItem {
  key: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedDays?: number;
  status: MilestoneStatus;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  notes?: string;
}

export interface StudentJourneyDocument extends Document {
  student: Types.ObjectId;
  application?: Types.ObjectId;
  visaCategory: Types.ObjectId;
  templateId?: Types.ObjectId;
  milestones: StudentMilestoneItem[];
  currentMilestoneKey?: string;
  overallProgress: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studentMilestoneItemSchema = new Schema<StudentMilestoneItem>(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 0 },
    isRequired: { type: Boolean, default: true },
    estimatedDays: { type: Number, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
      default: 'NOT_STARTED',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const studentJourneySchema = new Schema<StudentJourneyDocument>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    visaCategory: {
      type: Schema.Types.ObjectId,
      ref: 'VisaCategory',
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'MilestoneTemplate',
    },
    milestones: {
      type: [studentMilestoneItemSchema],
      required: true,
      default: [],
    },
    currentMilestoneKey: { type: String },
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'student_journeys' },
);

export const StudentJourneyModel: Model<StudentJourneyDocument> =
  mongoose.models.StudentJourney ||
  mongoose.model<StudentJourneyDocument>('StudentJourney', studentJourneySchema);