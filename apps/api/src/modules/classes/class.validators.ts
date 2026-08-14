import { z } from 'zod';
import { objectIdSchema } from '@consultancy/validators';

const timeSchema = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm');
const classStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED']);

const scheduleSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one day'),
  startTime: timeSchema,
  endTime: timeSchema,
  roomOrLocation: z.string().trim().max(200).optional(),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(200),
  branchId: objectIdSchema,
  programId: objectIdSchema.optional(),
  languageLevelId: objectIdSchema.optional(),
  teacherId: objectIdSchema,
  schedule: scheduleSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  programId: objectIdSchema.nullable().optional(),
  languageLevelId: objectIdSchema.nullable().optional(),
  teacherId: objectIdSchema.optional(),
  schedule: scheduleSchema.partial().optional(),
  endDate: z.string().datetime().optional(),
  status: classStatusSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const enrollStudentsSchema = z.object({
  studentIds: z.array(objectIdSchema).min(1, 'Select at least one student'),
});

export const listClassesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: classStatusSchema.optional(),
  branchId: objectIdSchema.optional(),
  teacherId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  languageLevelId: objectIdSchema.optional(),
});

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;
export type EnrollStudentsDto = z.infer<typeof enrollStudentsSchema>;
export type ListClassesQueryDto = z.infer<typeof listClassesQuerySchema>;