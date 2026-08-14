import { z } from 'zod';
import { objectIdSchema } from './common.validators.js';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  actorId: objectIdSchema.optional(),
  branchId: objectIdSchema.optional(),
  action: z.string().trim().optional(),
  category: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AuditLogQueryDto = z.infer<typeof auditLogQuerySchema>;