import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'VOIDED';

export type PaymentStatus = 'COMPLETED' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  application?: { id: string; applicationNumber: string } | null;
  branch: { id: string; code: string; name: string };
  currency: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  receiptNumber: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    balanceAmount: number;
  };
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  branch: { id: string; code: string; name: string };
  amount: number;
  currency: string;
  method: PaymentMethod;
  methodDetails?: {
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    transactionId?: string;
    notes?: string;
  };
  status: PaymentStatus;
  paidAt: string;
  recordedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  voidedAt?: string;
  voidReason?: string;
  notes?: string;
  createdAt: string;
}

export interface FinanceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalInvoices: number;
  overdueAmount: number;
  overdueCount: number;
  byStatus: Record<string, number>;
}

export interface ListInvoicesParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  branchId?: string;
  studentId?: string;
  overdue?: boolean;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  branchId?: string;
  studentId?: string;
  invoiceId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateInvoiceInput {
  studentId: string;
  applicationId?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount?: number;
  tax?: number;
  dueDate: string;
  notes?: string;
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  methodDetails?: {
    bankName?: string;
    accountNumber?: string;
    chequeNumber?: string;
    transactionId?: string;
    notes?: string;
  };
  paidAt?: string;
  notes?: string;
}

export const financeApi = {
  stats: (): Promise<FinanceStats> => api.get<FinanceStats>('/finance/stats'),

  // Invoices
  listInvoices: async (
    params: ListInvoicesParams = {},
  ): Promise<{ items: Invoice[]; pagination: PaginationMeta }> => {
    const items = await api.get<Invoice[]>(
      '/finance/invoices',
      params as Record<string, unknown>,
    );
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  getInvoiceById: (id: string): Promise<Invoice> =>
    api.get<Invoice>(`/finance/invoices/${id}`),

  createInvoice: (input: CreateInvoiceInput): Promise<Invoice> =>
    api.post<Invoice>('/finance/invoices', input),

  cancelInvoice: (id: string): Promise<Invoice> =>
    api.post<Invoice>(`/finance/invoices/${id}/cancel`),

  getMyInvoices: (): Promise<Invoice[]> =>
    api.get<Invoice[]>('/finance/invoices/me'),

  // Payments
  listPayments: async (
    params: ListPaymentsParams = {},
  ): Promise<{ items: Payment[]; pagination: PaginationMeta }> => {
    const items = await api.get<Payment[]>(
      '/finance/payments',
      params as Record<string, unknown>,
    );
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  getPaymentById: (id: string): Promise<Payment> =>
    api.get<Payment>(`/finance/payments/${id}`),

  createPayment: (input: CreatePaymentInput): Promise<Payment> =>
    api.post<Payment>('/finance/payments', input),

  voidPayment: (id: string, reason: string): Promise<Payment> =>
    api.post<Payment>(`/finance/payments/${id}/void`, { reason }),

  getMyPayments: (): Promise<Payment[]> =>
    api.get<Payment[]>('/finance/payments/me'),
};