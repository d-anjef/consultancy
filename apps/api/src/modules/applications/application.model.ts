import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@consultancy/config';

export interface ApplicationSchoolOrCompany {
  name: string;
  country: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ApplicationIntake {
  year: number;
  month?: number;
  session?: 'SPRING' | 'FALL' | 'WINTER' | 'SUMMER';
}

export interface ApplicationDeadlines {
  documentSubmission?: Date;
  applicationSubmission?: Date;
  result?: Date;
}

export interface ApplicationDocument extends Document {
  applicationNumber: string;
  student: Types.ObjectId;
  branch: Types.ObjectId;
  visaCategory: Types.ObjectId;
  program: Types.ObjectId;

  schoolOrCompany: ApplicationSchoolOrCompany;
  intake: ApplicationIntake;

  assignedCounselor: Types.ObjectId;
  assignedStaff: Types.ObjectId[];

  status: ApplicationStatus;
  deadlines?: ApplicationDeadlines;
  notes?: string;
  isActive: boolean;

  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schoolOrCompanySchema = new Schema<ApplicationSchoolOrCompany>(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'Japan' },
    address: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
  },
  { _id: false },
);

const intakeSchema = new Schema<ApplicationIntake>(
  {
    year: { type: Number, required: true, min: 2020, max: 2100 },
    month: { type: Number, min: 1, max: 12 },
    session: { type: String, enum: ['SPRING', 'FALL', 'WINTER', 'SUMMER'] },
  },
  { _id: false },
);

const deadlinesSchema = new Schema<ApplicationDeadlines>(
  {
    documentSubmission: { type: Date },
    applicationSubmission: { type: Date },
    result: { type: Date },
  },
  { _id: false },
);

const applicationSchema = new Schema<ApplicationDocument>(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    visaCategory: {
      type: Schema.Types.ObjectId,
      ref: 'VisaCategory',
      required: true,
      index: true,
    },
    program: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },
    schoolOrCompany: { type: schoolOrCompanySchema, required: true },
    intake: { type: intakeSchema, required: true },
    assignedCounselor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedStaff: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(APPLICATION_STATUSES),
      default: APPLICATION_STATUSES.DRAFT,
      index: true,
    },
    deadlines: { type: deadlinesSchema },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'applications' },
);

applicationSchema.index({ branch: 1, status: 1 });
applicationSchema.index({ student: 1, isActive: 1 });
applicationSchema.index({ 'intake.year': 1, 'intake.month': 1 });

export const ApplicationModel: Model<ApplicationDocument> =
  mongoose.models.Application ||
  mongoose.model<ApplicationDocument>('Application', applicationSchema);

// ─── Application Status History ────────────────────────────────────────

export interface ApplicationStatusHistoryDocument extends Document {
  application: Types.ObjectId;
  fromStatus?: string;
  toStatus: string;
  changedBy: Types.ObjectId;
  changedAt: Date;
  reason?: string;
}

const applicationStatusHistorySchema = new Schema<ApplicationStatusHistoryDocument>(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, required: true, default: Date.now },
    reason: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'application_status_histories',
  },
);

applicationStatusHistorySchema.index({ application: 1, changedAt: -1 });

export const ApplicationStatusHistoryModel: Model<ApplicationStatusHistoryDocument> =
  mongoose.models.ApplicationStatusHistory ||
  mongoose.model<ApplicationStatusHistoryDocument>(
    'ApplicationStatusHistory',
    applicationStatusHistorySchema,
  );