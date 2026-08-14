import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { COUNSELING_STATUSES, type CounselingStatus } from '@consultancy/config';

export interface CounselingOutcome {
  result?: 'QUALIFIED' | 'NOT_QUALIFIED' | 'NEEDS_FOLLOWUP';
  notes?: string;
  nextSteps?: string;
  recommendedProgram?: Types.ObjectId;
  recommendedVisaCategory?: Types.ObjectId;
}

export interface CounselingRescheduleEntry {
  previousDate: Date;
  previousTime: string;
  rescheduledAt: Date;
  rescheduledBy: Types.ObjectId;
  reason?: string;
}

export interface CounselingDocument extends Document {
  counselingNumber: string;
  lead: Types.ObjectId;
  branch: Types.ObjectId;
  counselor: Types.ObjectId;

  scheduledDate: Date;
  scheduledTime: string;
  durationMinutes: number;

  status: CounselingStatus;

  attendedAt?: Date;
  outcome?: CounselingOutcome;
  followUpDate?: Date;
  rescheduleHistory: CounselingRescheduleEntry[];

  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const outcomeSchema = new Schema<CounselingOutcome>(
  {
    result: { type: String, enum: ['QUALIFIED', 'NOT_QUALIFIED', 'NEEDS_FOLLOWUP'] },
    notes: { type: String, trim: true },
    nextSteps: { type: String, trim: true },
    recommendedProgram: { type: Schema.Types.ObjectId, ref: 'Program' },
    recommendedVisaCategory: { type: Schema.Types.ObjectId, ref: 'VisaCategory' },
  },
  { _id: false },
);

const rescheduleEntrySchema = new Schema<CounselingRescheduleEntry>(
  {
    previousDate: { type: Date, required: true },
    previousTime: { type: String, required: true },
    rescheduledAt: { type: Date, required: true },
    rescheduledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, trim: true },
  },
  { _id: false },
);

const counselingSchema = new Schema<CounselingDocument>(
  {
    counselingNumber: { type: String, required: true, unique: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    counselor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledDate: { type: Date, required: true, index: true },
    scheduledTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 60, min: 15, max: 480 },
    status: {
      type: String,
      required: true,
      enum: Object.values(COUNSELING_STATUSES),
      default: COUNSELING_STATUSES.BOOKED,
      index: true,
    },
    attendedAt: { type: Date },
    outcome: { type: outcomeSchema },
    followUpDate: { type: Date },
    rescheduleHistory: { type: [rescheduleEntrySchema], default: [] },
    cancellationReason: { type: String, trim: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'counselings' },
);

counselingSchema.index({ branch: 1, scheduledDate: 1 });
counselingSchema.index({ counselor: 1, scheduledDate: 1 });
counselingSchema.index({ branch: 1, status: 1, scheduledDate: 1 });

export const CounselingModel: Model<CounselingDocument> =
  mongoose.models.Counseling ||
  mongoose.model<CounselingDocument>('Counseling', counselingSchema);