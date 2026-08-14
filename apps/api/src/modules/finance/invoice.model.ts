import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { INVOICE_STATUSES, type InvoiceStatus } from '@consultancy/config';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDocument extends Document {
  invoiceNumber: string;
  student: Types.ObjectId;
  application?: Types.ObjectId;
  branch: Types.ObjectId;

  currency: string;

  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;

  status: InvoiceStatus;

  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;

  notes?: string;

  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<InvoiceLineItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    currency: { type: String, required: true, default: 'NPR' },
    lineItems: { type: [lineItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: Object.values(INVOICE_STATUSES),
      default: INVOICE_STATUSES.ISSUED,
      index: true,
    },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'invoices' },
);

invoiceSchema.index({ branch: 1, status: 1 });
invoiceSchema.index({ student: 1, status: 1 });

export const InvoiceModel: Model<InvoiceDocument> =
  mongoose.models.Invoice || mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);