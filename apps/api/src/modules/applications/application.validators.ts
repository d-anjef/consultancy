import { z } from 'zod';
import { APPLICATION_STATUSES } from '@consultancy/config';
import { emailSchema, objectIdSchema, phoneSchema } from '@consultancy/validators';

const appStatusSchema = z.enum(Object.values(APPLICATION_STATUSES) as [string, ...string[]]);

const schoolOrCompanySchema = z.object({
  name: z.string().trim().min(1).max(300),
  country: z.string().trim().min(1).max(100).default('Japan'),
  address: z.string().trim().max(500).optional(),
  contactPerson: z.string().trim().max(200).optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: phoneSchema.optional(),
});

const intakeSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12).optional(),
  session: z.enum(['SPRING', 'FALL', 'WINTER', 'SUMMER']).optional(),
});

const deadlinesSchema = z.object({
  documentSubmission: z.string().datetime().optional(),
  applicationSubmission: z.string().datetime().optional(),
  result: z.string().datetime().optional(),
});

export const createApplicationSchema = z.object({
  studentId: objectIdSchema,
  visaCategoryId: objectIdSchema,
  programId: objectIdSchema,
  schoolOrCompany: schoolOrCompanySchema,
  intake: intakeSchema,
  assignedCounselorId: objectIdSchema,
  notes: z.string().trim().max(2000).optional(),
});

export const updateApplicationSchema = z.object({
  schoolOrCompany: schoolOrCompanySchema.partial().optional(),
  intake: intakeSchema.partial().optional(),
  deadlines: deadlinesSchema.optional(),
  assignedCounselorId: objectIdSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const changeApplicationStatusSchema = z.object({
  status: appStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export const cancelApplicationSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: appStatusSchema.optional(),
  branchId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  visaCategoryId: objectIdSchema.optional(),
  programId: objectIdSchema.optional(),
  assignedCounselorId: objectIdSchema.optional(),
  intakeYear: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;
export type ChangeApplicationStatusDto = z.infer<typeof changeApplicationStatusSchema>;
export type CancelApplicationDto = z.infer<typeof cancelApplicationSchema>;
export type ListApplicationsQueryDto = z.infer<typeof listApplicationsQuerySchema>;