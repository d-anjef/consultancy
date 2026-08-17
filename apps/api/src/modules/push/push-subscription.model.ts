import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface PushSubscriptionDocument extends Document {
  user: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<PushSubscriptionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true, // One subscription per browser
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
    },
    browser: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'push_subscriptions' },
);

pushSubscriptionSchema.index({ user: 1, isActive: 1 });

export const PushSubscriptionModel: Model<PushSubscriptionDocument> =
  mongoose.models.PushSubscription ||
  mongoose.model<PushSubscriptionDocument>('PushSubscription', pushSubscriptionSchema);