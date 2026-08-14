import { z } from 'zod';
import { COUNSELING_STATUSES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';

const timeSchema = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm');
const counselingStatusSchema = z.enum(Object.values(COUNSELING_STATUSES) as [string, ...string[]]);

export const createCounselingSchema = z.object({
  leadId: objectIdSchema,
  counselorId: objectIdSchema,
  scheduledDate: z.string().datetime(),
  scheduledTime: timeSchema,
  durationMinutes: z.number().int().min(15).max(480).optional().default(60),
});

export const updateCounselingSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: timeSchema.optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  counselorId: objectIdSchema.optional(),
});

export const rescheduleCounselingSchema = z.object({
  scheduledDate: z.string().datetime(),
  scheduledTime: timeSchema,
  reason: z.string().trim().max(500).optional(),
});

export const cancelCounselingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const attendCounselingSchema = z.object({
  attendedAt: z.string().datetime().optional(),
  outcome: z
    .object({
      result: z.enum(['QUALIFIED', 'NOT_QUALIFIED', 'NEEDS_FOLLOWUP']).optional(),
      notes: z.string().trim().max(2000).optional(),
      nextSteps: z.string().trim().max(2000).optional(),
      recommendedProgramId: objectIdSchema.optional(),
      recommendedVisaCategoryId: objectIdSchema.optional(),
    })
    .optional(),
  followUpDate: z.string().datetime().optional(),
});

export const noShowCounselingSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

export const listCounselingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: counselingStatusSchema.optional(),
  branchId: objectIdSchema.optional(),
  counselorId: objectIdSchema.optional(),
  leadId: objectIdSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateCounselingDto = z.infer<typeof createCounselingSchema>;
export type UpdateCounselingDto = z.infer<typeof updateCounselingSchema>;
export type RescheduleCounselingDto = z.infer<typeof rescheduleCounselingSchema>;
export type CancelCounselingDto = z.infer<typeof cancelCounselingSchema>;
export type AttendCounselingDto = z.infer<typeof attendCounselingSchema>;
export type NoShowCounselingDto = z.infer<typeof noShowCounselingSchema>;
export type ListCounselingQueryDto = z.infer<typeof listCounselingQuerySchema>;