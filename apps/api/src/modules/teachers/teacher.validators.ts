import { z } from 'zod';
import { objectIdSchema } from '@consultancy/validators';

const employmentTypeSchema = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING']);

export const createTeacherProfileSchema = z.object({
  userId: objectIdSchema,
  qualification: z.string().trim().max(500).optional(),
  specialization: z.array(z.string().trim().max(100)).optional().default([]),
  experienceYears: z.number().int().min(0).max(60).optional(),
  employmentType: employmentTypeSchema.default('FULL_TIME'),
  joinedDate: z.string().datetime().optional(),
  bio: z.string().trim().max(2000).optional(),
});

export const updateTeacherProfileSchema = z.object({
  qualification: z.string().trim().max(500).optional(),
  specialization: z.array(z.string().trim().max(100)).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  employmentType: employmentTypeSchema.optional(),
  bio: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const listTeachersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  branchId: objectIdSchema.optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateTeacherProfileDto = z.infer<typeof createTeacherProfileSchema>;
export type UpdateTeacherProfileDto = z.infer<typeof updateTeacherProfileSchema>;
export type ListTeachersQueryDto = z.infer<typeof listTeachersQuerySchema>;