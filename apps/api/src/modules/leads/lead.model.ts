import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { LEAD_STATUSES, LEAD_SOURCES, type LeadStatus, type LeadSource } from '@consultancy/config';

export interface LeadPersonal {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: Date;
  occupation?: string;
}

export interface LeadAddress {
  permanentAddress?: string;
  presentAddress?: string;
}

export interface LeadEducation {
  lastEducation?: '10+2' | 'BACHELOR' | 'MASTER' | 'OTHER';
  faculty?: string;
  japaneseLanguageHistory?: boolean;
  japanesePassedYear?: string;
  japaneseInstitute?: string;
}

export interface LeadPreference {
  preferredCollege?: string;
  periodOfStudy?: string;
  preferredIntake?: 'APRIL' | 'JULY' | 'OCTOBER' | 'JANUARY';
  previousVisaApply?: boolean;
}

export interface LeadFamily {
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
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
  address?: LeadAddress;
  education?: LeadEducation;
  preference?: LeadPreference;
  family?: LeadFamily;

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
    middleName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    dateOfBirth: { type: Date },
    occupation: { type: String, trim: true },
  },
  { _id: false },
);

const addressSchema = new Schema<LeadAddress>(
  {
    permanentAddress: { type: String, trim: true },
    presentAddress: { type: String, trim: true },
  },
  { _id: false },
);

const educationSchema = new Schema<LeadEducation>(
  {
    lastEducation: {
      type: String,
      enum: ['10+2', 'BACHELOR', 'MASTER', 'OTHER'],
    },
    faculty: { type: String, trim: true },
    japaneseLanguageHistory: { type: Boolean },
    japanesePassedYear: { type: String, trim: true },
    japaneseInstitute: { type: String, trim: true },
  },
  { _id: false },
);

const preferenceSchema = new Schema<LeadPreference>(
  {
    preferredCollege: { type: String, trim: true },
    periodOfStudy: { type: String, trim: true },
    preferredIntake: {
      type: String,
      enum: ['APRIL', 'JULY', 'OCTOBER', 'JANUARY'],
    },
    previousVisaApply: { type: Boolean },
  },
  { _id: false },
);

const familySchema = new Schema<LeadFamily>(
  {
    fatherName: { type: String, trim: true },
    fatherPhone: { type: String, trim: true },
    motherName: { type: String, trim: true },
    motherPhone: { type: String, trim: true },
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
    address: { type: addressSchema },
    education: { type: educationSchema },
    preference: { type: preferenceSchema },
    family: { type: familySchema },
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