import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { PAYMENT_STATUSES, PAYMENT_METHODS, type PaymentStatus, type PaymentMethod } from '@consultancy/config';

export interface PaymentMethodDetails {
  bankName?: string;
  accountNumber?: string;
  chequeNumber?: string;
  transactionId?: string;
  notes?: string;
}

export interface PaymentDocument extends Document {
  paymentNumber: string;
  receiptNumber: string;
  invoice: Types.ObjectId;
  student: Types.ObjectId;
  branch: Types.ObjectId;

  amount: number;
  currency: string;

  method: PaymentMethod;
  methodDetails?: PaymentMethodDetails;

  status: PaymentStatus;

  paidAt: Date;
  recordedBy: Types.ObjectId;

  voidedBy?: Types.ObjectId;
  voidedAt?: Date;
  voidReason?: string;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const methodDetailsSchema = new Schema<PaymentMethodDetails>(
  {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    chequeNumber: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const paymentSchema = new Schema<PaymentDocument>(
  {
    paymentNumber: { type: String, required: true, unique: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'NPR' },
    method: {
      type: String,
      required: true,
      enum: Object.values(PAYMENT_METHODS),
    },
    methodDetails: { type: methodDetailsSchema },
    status: {
      type: String,
      required: true,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.COMPLETED,
      index: true,
    },
    paidAt: { type: Date, required: true, default: Date.now, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidedAt: { type: Date },
    voidReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'payments' },
);

paymentSchema.index({ branch: 1, paidAt: -1 });

export const PaymentModel: Model<PaymentDocument> =
  mongoose.models.Payment || mongoose.model<PaymentDocument>('Payment', paymentSchema);