import { Types } from 'mongoose';
import { ORGANIZATION_WIDE_ROLE_CODES, type RoleCode } from '@consultancy/config';
import { financeRepository } from './finance.repository.js';
import { studentRepository } from '../students/student.repository.js';
import type { InvoiceDocument } from './invoice.model.js';
import type { PaymentDocument } from './payment.model.js';
import type { StudentDocument } from '../students/student.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import type { UserDocument } from '../users/user.model.js';
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateInvoiceNumber, generatePaymentNumber, generateReceiptNumber } from '../../lib/studentId.js';
import type {
  CreateInvoiceDto,
  CreatePaymentDto,
  VoidPaymentDto,
  ListInvoicesQueryDto,
  ListPaymentsQueryDto,
} from './finance.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedInvoice {
  id: string;
  invoiceNumber: string;
  student: { id: string; studentId: string; firstName: string; lastName: string };
  application?: { id: string; applicationNumber: string } | null;
  branch: { id: string; code: string; name: string };
  currency: string;
  lineItems: InvoiceDocument['lineItems'];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormattedPayment {
  id: string;
  paymentNumber: string;
  receiptNumber: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    balanceAmount: number;
  };
  student: { id: string; studentId: string; firstName: string; lastName: string };
  branch: { id: string; code: string; name: string };
  amount: number;
  currency: string;
  method: string;
  methodDetails?: PaymentDocument['methodDetails'];
  status: string;
  paidAt: Date;
  recordedBy: { id: string; email: string; firstName: string; lastName: string };
  voidedAt?: Date;
  voidReason?: string;
  notes?: string;
  createdAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class FinanceService {
  // ─── Invoices ───────────────────────────────────

  async listInvoices(
    query: ListInvoicesQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedInvoice[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await financeRepository.listInvoices(
      {
        branchId: branchFilter,
        studentId: query.studentId,
        status: query.status as never,
        overdue: query.overdue,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((i) => this.formatInvoice(i)), pagination };
  }

  async getInvoiceById(id: string, actor: ActorContext): Promise<FormattedInvoice> {
    const inv = await financeRepository.findInvoiceById(id);
    if (!inv) throw new NotFoundError('Invoice', id);
    this.enforceInvoiceAccess(inv, actor);
    return this.formatInvoice(inv);
  }

  async createInvoice(data: CreateInvoiceDto, actor: ActorContext): Promise<FormattedInvoice> {
    const student = await studentRepository.findById(data.studentId);
    if (!student) throw new NotFoundError('Student', data.studentId);

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const studentBranchId = String((student.branch as unknown as BranchDocument)._id);
    if (!isOrgWide && studentBranchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this student's branch");
    }

    // Calculate totals
    const lineItemsWithTotal = data.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = lineItemsWithTotal.reduce((sum, i) => sum + i.total, 0);
    const totalAmount = subtotal - data.discount + data.tax;

    if (totalAmount < 0) {
      throw new BusinessRuleError('Total amount cannot be negative');
    }

    const invoiceNumber = await generateInvoiceNumber();

    const created = await financeRepository.createInvoice({
      invoiceNumber,
      student: student._id as Types.ObjectId,
      application: data.applicationId ? new Types.ObjectId(data.applicationId) : undefined,
      branch: (student.branch as unknown as BranchDocument)._id as Types.ObjectId,
      lineItems: lineItemsWithTotal,
      subtotal,
      discount: data.discount,
      tax: data.tax,
      totalAmount,
      balanceAmount: totalAmount,
      dueDate: new Date(data.dueDate),
      notes: data.notes,
      createdBy: new Types.ObjectId(actor.id),
    });

    return this.formatInvoice(created);
  }

  async cancelInvoice(id: string, actor: ActorContext): Promise<FormattedInvoice> {
    const inv = await financeRepository.findInvoiceById(id);
    if (!inv) throw new NotFoundError('Invoice', id);
    this.enforceInvoiceAccess(inv, actor);

    if (inv.paidAmount > 0) {
      throw new BusinessRuleError(
        'Cannot cancel invoice with payments. Void the payments first.',
      );
    }
    if (inv.status === 'CANCELLED') {
      throw new BusinessRuleError('Invoice is already cancelled');
    }

    const updated = await financeRepository.cancelInvoice(id, new Types.ObjectId(actor.id));
    if (!updated) throw new NotFoundError('Invoice', id);
    return this.formatInvoice(updated);
  }

  async listOwnInvoices(userId: string): Promise<FormattedInvoice[]> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new NotFoundError('Student profile');
    const invoices = await financeRepository.findInvoicesByStudent(String(student._id));
    return invoices.map((i) => this.formatInvoice(i));
  }

  // ─── Payments ───────────────────────────────────

  async listPayments(
    query: ListPaymentsQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedPayment[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await financeRepository.listPayments(
      {
        branchId: branchFilter,
        studentId: query.studentId,
        invoiceId: query.invoiceId,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((p) => this.formatPayment(p)), pagination };
  }

  async getPaymentById(id: string, actor: ActorContext): Promise<FormattedPayment> {
    const p = await financeRepository.findPaymentById(id);
    if (!p) throw new NotFoundError('Payment', id);
    this.enforcePaymentAccess(p, actor);
    return this.formatPayment(p);
  }

  async createPayment(data: CreatePaymentDto, actor: ActorContext): Promise<FormattedPayment> {
    const invoice = await financeRepository.findInvoiceById(data.invoiceId);
    if (!invoice) throw new NotFoundError('Invoice', data.invoiceId);

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const invoiceBranchId = String((invoice.branch as unknown as BranchDocument)._id);
    if (!isOrgWide && invoiceBranchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this invoice's branch");
    }

    if (invoice.status === 'CANCELLED' || invoice.status === 'VOIDED') {
      throw new BusinessRuleError(`Cannot record payment for ${invoice.status} invoice`);
    }

    if (data.amount > invoice.balanceAmount) {
      throw new BusinessRuleError(
        `Payment amount (${data.amount}) exceeds outstanding balance (${invoice.balanceAmount})`,
      );
    }

    const paymentNumber = await generatePaymentNumber();
    const receiptNumber = await generateReceiptNumber();

    const student = invoice.student as unknown as StudentDocument;

    const created = await financeRepository.createPayment({
      paymentNumber,
      receiptNumber,
      invoice: invoice._id as Types.ObjectId,
      student: student._id as Types.ObjectId,
      branch: (invoice.branch as unknown as BranchDocument)._id as Types.ObjectId,
      amount: data.amount,
      method: data.method as never,
      methodDetails: data.methodDetails,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      recordedBy: new Types.ObjectId(actor.id),
      notes: data.notes,
    });

    // Update invoice
    const newPaidAmount = invoice.paidAmount + data.amount;
    const newBalance = invoice.balanceAmount - data.amount;
    await financeRepository.updateInvoicePayment(
      String(invoice._id),
      newPaidAmount,
      newBalance,
      new Types.ObjectId(actor.id),
    );

    return this.formatPayment(created);
  }

  async voidPayment(
    id: string,
    data: VoidPaymentDto,
    actor: ActorContext,
  ): Promise<FormattedPayment> {
    const payment = await financeRepository.findPaymentById(id);
    if (!payment) throw new NotFoundError('Payment', id);
    this.enforcePaymentAccess(payment, actor);

    if (payment.status === 'VOIDED') {
      throw new BusinessRuleError('Payment is already voided');
    }

    const voided = await financeRepository.voidPayment(
      id,
      data.reason,
      new Types.ObjectId(actor.id),
    );
    if (!voided) throw new NotFoundError('Payment', id);

    // Reverse the invoice payment
    const invoice = payment.invoice as unknown as InvoiceDocument;
    const newPaidAmount = invoice.paidAmount - payment.amount;
    const newBalance = invoice.balanceAmount + payment.amount;
    await financeRepository.updateInvoicePayment(
      String(invoice._id),
      newPaidAmount,
      newBalance,
      new Types.ObjectId(actor.id),
    );

    return this.formatPayment(voided);
  }

  async listOwnPayments(userId: string): Promise<FormattedPayment[]> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new NotFoundError('Student profile');
    const payments = await financeRepository.findPaymentsByStudent(String(student._id));
    return payments.map((p) => this.formatPayment(p));
  }

  async getStats(actor: ActorContext) {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchId = isOrgWide ? undefined : actor.branch ?? undefined;
    return financeRepository.getFinanceStats(branchId);
  }

  private enforceInvoiceAccess(inv: InvoiceDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branchId = String((inv.branch as unknown as BranchDocument)._id);
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this invoice's branch");
    }
  }

  private enforcePaymentAccess(p: PaymentDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branchId = String((p.branch as unknown as BranchDocument)._id);
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this payment's branch");
    }
  }

  private formatInvoice(inv: InvoiceDocument): FormattedInvoice {
    const student = inv.student as unknown as StudentDocument;
    const branch = inv.branch as unknown as BranchDocument;
    const application = inv.application as unknown as
      | { _id: Types.ObjectId; applicationNumber: string }
      | undefined;

    return {
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber,
      student: {
        id: String(student._id),
        studentId: student.studentId,
        firstName: student.personal.firstName,
        lastName: student.personal.lastName,
      },
      application: application
        ? { id: String(application._id), applicationNumber: application.applicationNumber }
        : null,
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      currency: inv.currency,
      lineItems: inv.lineItems,
      subtotal: inv.subtotal,
      discount: inv.discount,
      tax: inv.tax,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balanceAmount: inv.balanceAmount,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      paidDate: inv.paidDate,
      notes: inv.notes,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };
  }

  private formatPayment(p: PaymentDocument): FormattedPayment {
    const student = p.student as unknown as StudentDocument;
    const invoice = p.invoice as unknown as InvoiceDocument;
    const branch = p.branch as unknown as BranchDocument;
    const recorder = p.recordedBy as unknown as UserDocument;

    return {
      id: String(p._id),
      paymentNumber: p.paymentNumber,
      receiptNumber: p.receiptNumber,
      invoice: {
        id: String(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        balanceAmount: invoice.balanceAmount,
      },
      student: {
        id: String(student._id),
        studentId: student.studentId,
        firstName: student.personal.firstName,
        lastName: student.personal.lastName,
      },
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      methodDetails: p.methodDetails,
      status: p.status,
      paidAt: p.paidAt,
      recordedBy: {
        id: String(recorder._id),
        email: recorder.email,
        firstName: recorder.profile.firstName,
        lastName: recorder.profile.lastName,
      },
      voidedAt: p.voidedAt,
      voidReason: p.voidReason,
      notes: p.notes,
      createdAt: p.createdAt,
    };
  }
}

export const financeService = new FinanceService();