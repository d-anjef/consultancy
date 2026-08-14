import { z } from 'zod';
import { objectIdSchema } from '@consultancy/validators';

const examTypeSchema = z.enum(['JLPT', 'NAT', 'CUSTOM']);

export const createLanguageLevelSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Only uppercase letters, numbers, hyphens, underscores')
    .min(2)
    .max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  examType: examTypeSchema.default('JLPT'),
  order: z.number().int().min(0).default(0),
  durationMonths: z.number().int().min(1).max(60).optional(),
  prerequisiteId: objectIdSchema.optional(),
  fee: z.number().min(0).optional(),
});

export const updateLanguageLevelSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  examType: examTypeSchema.optional(),
  order: z.number().int().min(0).optional(),
  durationMonths: z.number().int().min(1).max(60).optional(),
  prerequisiteId: objectIdSchema.nullable().optional(),
  fee: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateLanguageLevelDto = z.infer<typeof createLanguageLevelSchema>;
export type UpdateLanguageLevelDto = z.infer<typeof updateLanguageLevelSchema>;