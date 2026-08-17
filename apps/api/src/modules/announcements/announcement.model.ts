import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type AnnouncementCategory = 'HOLIDAY' | 'EVENT' | 'NOTICE' | 'GENERAL';
export type AnnouncementAudience =
  | 'ALL_USERS'
  | 'ALL_STUDENTS'
  | 'ALL_STAFF'
  | 'BY_BRANCH'
  | 'BY_ROLE';
export type AnnouncementStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';

export interface AnnouncementDocument extends Document {
  title: string;
  message: string;
  category: AnnouncementCategory;

  audience: AnnouncementAudience;
  // If audience = BY_BRANCH → branchIds must be provided
  branchIds?: Types.ObjectId[];
  // If audience = BY_ROLE → roleCodes must be provided
  roleCodes?: string[];
  // Whether to include students in ALL_USERS/BY_BRANCH selections
  includeStudents: boolean;

  sendEmail: boolean;
  sendInApp: boolean;

  status: AnnouncementStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;

  sentBy: Types.ObjectId;
  sentAt?: Date;

  errorLog?: string;

  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      required: true,
      enum: ['HOLIDAY', 'EVENT', 'NOTICE', 'GENERAL'],
      default: 'GENERAL',
    },
    audience: {
      type: String,
      required: true,
      enum: ['ALL_USERS', 'ALL_STUDENTS', 'ALL_STAFF', 'BY_BRANCH', 'BY_ROLE'],
    },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    roleCodes: [{ type: String }],
    includeStudents: { type: Boolean, default: true },
    sendEmail: { type: Boolean, default: true },
    sendInApp: { type: Boolean, default: true },
    status: {
      type: String,
      required: true,
      enum: ['DRAFT', 'SENDING', 'SENT', 'FAILED'],
      default: 'DRAFT',
      index: true,
    },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sentAt: { type: Date },
    errorLog: { type: String },
  },
  { timestamps: true, collection: 'announcements' },
);

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ status: 1, createdAt: -1 });

export const AnnouncementModel: Model<AnnouncementDocument> =
  mongoose.models.Announcement ||
  mongoose.model<AnnouncementDocument>('Announcement', announcementSchema);