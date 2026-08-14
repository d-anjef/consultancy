import { z } from 'zod';
import { objectIdSchema } from '@consultancy/validators';

const milestoneItemSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, underscores only')
    .min(1)
    .max(50),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional(),
  order: z.number().int().min(0),
  isRequired: z.boolean().default(true),
  estimatedDays: z.number().int().min(0).max(3650).optional(),
});

export const createTemplateSchema = z.object({
  visaCategoryId: objectIdSchema,
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  milestones: z.array(milestoneItemSchema).min(1, 'At least one milestone required'),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  milestones: z.array(milestoneItemSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createJourneyForStudentSchema = z.object({
  studentId: objectIdSchema,
  applicationId: objectIdSchema.optional(),
  visaCategoryId: objectIdSchema.optional(),
});

export const updateMilestoneStatusSchema = z.object({
  milestoneKey: z.string().trim().min(1),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  notes: z.string().trim().max(2000).optional(),
});

export const updateMilestoneNotesSchema = z.object({
  milestoneKey: z.string().trim().min(1),
  notes: z.string().trim().max(2000),
});

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
export type CreateJourneyForStudentDto = z.infer<typeof createJourneyForStudentSchema>;
export type UpdateMilestoneStatusDto = z.infer<typeof updateMilestoneStatusSchema>;
export type UpdateMilestoneNotesDto = z.infer<typeof updateMilestoneNotesSchema>;