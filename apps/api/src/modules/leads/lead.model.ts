import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { LEAD_STATUSES, LEAD_SOURCES, type LeadStatus, type LeadSource } from '@consultancy/config';

export interface LeadPersonal {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface LeadSourceMetadata {
  formId?: string;
  referredBy?: string;
  utmSource?: string;
  utmCampaign?: string;
  externalRef?: string;
}

export interface LeadPreferredCounseling {
  date?: Date;
  time?: string;
}

export interface LeadDocument extends Document {
  leadNumber: string;
  branch: Types.ObjectId;

  personal: LeadPersonal;

  source: LeadSource;
  sourceMetadata?: LeadSourceMetadata;

  interestedProgram?: Types.ObjectId;
  interestedVisaCategory?: Types.ObjectId;

  preferredCounseling?: LeadPreferredCounseling;

  assignedCounselor?: Types.ObjectId;

  status: LeadStatus;

  notes?: string;

  convertedToStudent?: Types.ObjectId;
  convertedAt?: Date;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const personalSchema = new Schema<LeadPersonal>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
  },
  { _id: false },
);

const sourceMetadataSchema = new Schema<LeadSourceMetadata>(
  {
    formId: { type: String, trim: true },
    referredBy: { type: String, trim: true },
    utmSource: { type: String, trim: true },
    utmCampaign: { type: String, trim: true },
    externalRef: { type: String, trim: true },
  },
  { _id: false },
);

const preferredCounselingSchema = new Schema<LeadPreferredCounseling>(
  {
    date: { type: Date },
    time: { type: String, trim: true },
  },
  { _id: false },
);

const leadSchema = new Schema<LeadDocument>(
  {
    leadNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    personal: {
      type: personalSchema,
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: Object.values(LEAD_SOURCES),
      index: true,
    },
    sourceMetadata: {
      type: sourceMetadataSchema,
    },
    interestedProgram: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
    },
    interestedVisaCategory: {
      type: Schema.Types.ObjectId,
      ref: 'VisaCategory',
    },
    preferredCounseling: {
      type: preferredCounselingSchema,
    },
    assignedCounselor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(LEAD_STATUSES),
      default: LEAD_STATUSES.NEW,
      index: true,
    },
    notes: { type: String, trim: true },
    convertedToStudent: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    convertedAt: { type: Date },
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
    collection: 'leads',
  },
);

leadSchema.index({ branch: 1, status: 1 });
leadSchema.index({ branch: 1, createdAt: -1 });
leadSchema.index({ assignedCounselor: 1, status: 1 });

export const LeadModel: Model<LeadDocument> =
  mongoose.models.Lead || mongoose.model<LeadDocument>('Lead', leadSchema);