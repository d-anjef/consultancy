import { Types, type FilterQuery } from 'mongoose';
import { InvoiceModel, type InvoiceDocument } from './invoice.model.js';
import { PaymentModel, type PaymentDocument } from './payment.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import type { InvoiceStatus, PaymentMethod } from '@consultancy/config';

const INVOICE_POPULATE = [
  {
    path: 'student',
    select: 'studentId personal.firstName personal.lastName contact.phone contact.email',
  },
  { path: 'application', select: 'applicationNumber' },
  { path: 'branch', select: 'code name' },
  { path: 'createdBy', select: 'email profile.firstName profile.lastName' },
];

const PAYMENT_POPULATE = [
  {
    path: 'student',
    select: 'studentId personal.firstName personal.lastName',
  },
  {
    path: 'invoice',
    select: 'invoiceNumber totalAmount balanceAmount',
  },
  { path: 'branch', select: 'code name' },
  { path: 'recordedBy', select: 'email profile.firstName profile.lastName' },
];

export interface CreateInvoiceData {
  invoiceNumber: string;
  student: Types.ObjectId;
  application?: Types.ObjectId;
  branch: Types.ObjectId;
  lineItems: InvoiceDocument['lineItems'];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  balanceAmount: number;
  dueDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface CreatePaymentData {
  paymentNumber: string;
  receiptNumber: string;
  invoice: Types.ObjectId;
  student: Types.ObjectId;
  branch: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  methodDetails?: PaymentDocument['methodDetails'];
  paidAt: Date;
  recordedBy: Types.ObjectId;
  notes?: string;
}

export interface ListInvoicesFilter {
  branchId?: string;
  studentId?: string;
  status?: InvoiceStatus;
  overdue?: boolean;
}

export interface ListPaymentsFilter {
  branchId?: string;
  studentId?: string;
  invoiceId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export class FinanceRepository {
  // ─── Invoices ───────────────────────────────────

  async findInvoiceById(id: string): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return InvoiceModel.findById(id)
      .populate(INVOICE_POPULATE)
      .lean<InvoiceDocument | null>();
  }

  async findInvoicesByStudent(studentId: string): Promise<InvoiceDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) return [];
    return InvoiceModel.find({ student: new Types.ObjectId(studentId) })
      .populate(INVOICE_POPULATE)
      .sort({ createdAt: -1 })
      .lean<InvoiceDocument[]>();
  }

  async createInvoice(data: CreateInvoiceData): Promise<InvoiceDocument> {
    const invoice = await InvoiceModel.create(data);
    const populated = await InvoiceModel.findById(invoice._id)
      .populate(INVOICE_POPULATE)
      .lean<InvoiceDocument | null>();
    if (!populated) throw new Error('Failed to load created invoice');
    return populated;
  }

  async updateInvoicePayment(
    invoiceId: string,
    newPaidAmount: number,
    newBalance: number,
    updatedBy: Types.ObjectId,
  ): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(invoiceId)) return null;

    let newStatus: InvoiceStatus;
    if (newBalance <= 0) newStatus = 'PAID';
    else if (newPaidAmount > 0) newStatus = 'PARTIALLY_PAID';
    else newStatus = 'ISSUED';

    const updateOps: Record<string, unknown> = {
      paidAmount: newPaidAmount,
      balanceAmount: newBalance,
      status: newStatus,
      updatedBy,
    };
    if (newStatus === 'PAID') updateOps.paidDate = new Date();

    return InvoiceModel.findByIdAndUpdate(invoiceId, { $set: updateOps }, { new: true })
      .populate(INVOICE_POPULATE)
      .lean<InvoiceDocument | null>();
  }

  async cancelInvoice(id: string, updatedBy: Types.ObjectId): Promise<InvoiceDocument | null> {
    return InvoiceModel.findByIdAndUpdate(
      id,
      { $set: { status: 'CANCELLED', updatedBy } },
      { new: true },
    )
      .populate(INVOICE_POPULATE)
      .lean<InvoiceDocument | null>();
  }

  async listInvoices(
    filter: ListInvoicesFilter,
    page: number,
    limit: number,
  ): Promise<{ items: InvoiceDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<InvoiceDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.studentId && Types.ObjectId.isValid(filter.studentId)) {
      query.student = new Types.ObjectId(filter.studentId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.overdue) {
      query.dueDate = { $lt: new Date() };
      query.balanceAmount = { $gt: 0 };
      query.status = { $in: ['ISSUED', 'PARTIALLY_PAID'] };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      InvoiceModel.find(query)
        .populate(INVOICE_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<InvoiceDocument[]>(),
      InvoiceModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }

  async getFinanceStats(branchId?: string) {
    const matchStage: Record<string, unknown> = {};
    if (branchId && Types.ObjectId.isValid(branchId)) {
      matchStage.branch = new Types.ObjectId(branchId);
    }

    const [totalStats, statusCounts, overdue] = await Promise.all([
      InvoiceModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: '$totalAmount' },
            totalPaid: { $sum: '$paidAmount' },
            totalOutstanding: { $sum: '$balanceAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      InvoiceModel.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      InvoiceModel.aggregate([
        {
          $match: {
            ...matchStage,
            dueDate: { $lt: new Date() },
            balanceAmount: { $gt: 0 },
            status: { $in: ['ISSUED', 'PARTIALLY_PAID'] },
          },
        },
        {
          $group: {
            _id: null,
            overdueAmount: { $sum: '$balanceAmount' },
            overdueCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = totalStats[0] ?? {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      count: 0,
    };
    const overdueData = overdue[0] ?? { overdueAmount: 0, overdueCount: 0 };
    const byStatus: Record<string, number> = {};
    for (const s of statusCounts) byStatus[s._id] = s.count;

    return {
      totalInvoiced: stats.totalInvoiced,
      totalPaid: stats.totalPaid,
      totalOutstanding: stats.totalOutstanding,
      totalInvoices: stats.count,
      overdueAmount: overdueData.overdueAmount,
      overdueCount: overdueData.overdueCount,
      byStatus,
    };
  }

  // ─── Payments ───────────────────────────────────

  async findPaymentById(id: string): Promise<PaymentDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return PaymentModel.findById(id)
      .populate(PAYMENT_POPULATE)
      .lean<PaymentDocument | null>();
  }

  async findPaymentsByStudent(studentId: string): Promise<PaymentDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) return [];
    return PaymentModel.find({ student: new Types.ObjectId(studentId) })
      .populate(PAYMENT_POPULATE)
      .sort({ paidAt: -1 })
      .lean<PaymentDocument[]>();
  }

  async findPaymentsByInvoice(invoiceId: string): Promise<PaymentDocument[]> {
    if (!Types.ObjectId.isValid(invoiceId)) return [];
    return PaymentModel.find({ invoice: new Types.ObjectId(invoiceId) })
      .populate(PAYMENT_POPULATE)
      .sort({ paidAt: -1 })
      .lean<PaymentDocument[]>();
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentDocument> {
    const payment = await PaymentModel.create(data);
    const populated = await PaymentModel.findById(payment._id)
      .populate(PAYMENT_POPULATE)
      .lean<PaymentDocument | null>();
    if (!populated) throw new Error('Failed to load created payment');
    return populated;
  }

  async voidPayment(
    id: string,
    reason: string,
    voidedBy: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    return PaymentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'VOIDED',
          voidedBy,
          voidedAt: new Date(),
          voidReason: reason,
        },
      },
      { new: true },
    )
      .populate(PAYMENT_POPULATE)
      .lean<PaymentDocument | null>();
  }

  async listPayments(
    filter: ListPaymentsFilter,
    page: number,
    limit: number,
  ): Promise<{ items: PaymentDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<PaymentDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.studentId && Types.ObjectId.isValid(filter.studentId)) {
      query.student = new Types.ObjectId(filter.studentId);
    }
    if (filter.invoiceId && Types.ObjectId.isValid(filter.invoiceId)) {
      query.invoice = new Types.ObjectId(filter.invoiceId);
    }
    if (filter.fromDate || filter.toDate) {
      query.paidAt = {};
      if (filter.fromDate) query.paidAt.$gte = filter.fromDate;
      if (filter.toDate) query.paidAt.$lte = filter.toDate;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PaymentModel.find(query)
        .populate(PAYMENT_POPULATE)
        .sort({ paidAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<PaymentDocument[]>(),
      PaymentModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }
}

export const financeRepository = new FinanceRepository();