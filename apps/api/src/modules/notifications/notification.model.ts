import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type NotificationChannel = 'IN_APP' | 'EMAIL';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationCategory =
  | 'COUNSELING' | 'DOCUMENTS' | 'APPLICATIONS' | 'FINANCE'
  | 'ATTENDANCE' | 'TASKS' | 'ANNOUNCEMENTS' | 'SYSTEM';

export interface NotificationDocument extends Document {
  recipient: Types.ObjectId;
  recipientRole: string;
  branch?: Types.ObjectId;

  event: string;
  category: NotificationCategory;

  title: string;
  message: string;

  metadata?: {
    entityType?: string;
    entityId?: string;
    deepLink?: string;
  };

  channel: NotificationChannel;
  isRead: boolean;
  readAt?: Date;

  priority: NotificationPriority;
  isMandatory: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientRole: { type: String, required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    event: { type: String, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['COUNSELING', 'DOCUMENTS', 'APPLICATIONS', 'FINANCE', 'ATTENDANCE', 'TASKS', 'ANNOUNCEMENTS', 'SYSTEM'],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    metadata: {
      entityType: { type: String },
      entityId: { type: String },
      deepLink: { type: String },
    },
    channel: {
      type: String,
      required: true,
      enum: ['IN_APP', 'EMAIL'],
      default: 'IN_APP',
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    priority: {
      type: String,
      required: true,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    isMandatory: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'notifications' },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>('Notification', notificationSchema);