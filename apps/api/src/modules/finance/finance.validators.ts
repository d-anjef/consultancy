import { z } from 'zod';
import { INVOICE_STATUSES, PAYMENT_METHODS } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';

const invoiceStatusSchema = z.enum(Object.values(INVOICE_STATUSES) as [string, ...string[]]);
const paymentMethodSchema = z.enum(Object.values(PAYMENT_METHODS) as [string, ...string[]]);

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  studentId: objectIdSchema,
  applicationId: objectIdSchema.optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  dueDate: z.string().datetime(),
  notes: z.string().trim().max(2000).optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: objectIdSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  method: paymentMethodSchema,
  methodDetails: z
    .object({
      bankName: z.string().trim().optional(),
      accountNumber: z.string().trim().optional(),
      chequeNumber: z.string().trim().optional(),
      transactionId: z.string().trim().optional(),
      notes: z.string().trim().optional(),
    })
    .optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const voidPaymentSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: invoiceStatusSchema.optional(),
  branchId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  overdue: z.coerce.boolean().optional(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  branchId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  invoiceId: objectIdSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type VoidPaymentDto = z.infer<typeof voidPaymentSchema>;
export type ListInvoicesQueryDto = z.infer<typeof listInvoicesQuerySchema>;
export type ListPaymentsQueryDto = z.infer<typeof listPaymentsQuerySchema>;