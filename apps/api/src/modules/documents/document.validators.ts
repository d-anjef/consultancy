import { z } from 'zod';
import { DOCUMENT_STATUSES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';

const documentStatusSchema = z.enum(Object.values(DOCUMENT_STATUSES) as [string, ...string[]]);

export const uploadDocumentMetadataSchema = z.object({
  studentId: objectIdSchema,
  applicationId: objectIdSchema.optional(),
  documentType: z.string().trim().toUpperCase().min(2).max(50),
  documentName: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const rejectDocumentSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

export const requestResubmissionSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: documentStatusSchema.optional(),
  branchId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  applicationId: objectIdSchema.optional(),
  documentType: z.string().trim().optional(),
});

export type UploadDocumentMetadataDto = z.infer<typeof uploadDocumentMetadataSchema>;
export type RejectDocumentDto = z.infer<typeof rejectDocumentSchema>;
export type RequestResubmissionDto = z.infer<typeof requestResubmissionSchema>;
export type ListDocumentsQueryDto = z.infer<typeof listDocumentsQuerySchema>;