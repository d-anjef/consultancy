import { z } from 'zod';
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';

const taskTypeSchema = z.enum(Object.values(TASK_TYPES) as [string, ...string[]]);
const prioritySchema = z.enum(Object.values(TASK_PRIORITIES) as [string, ...string[]]);
const taskStatusSchema = z.enum(Object.values(TASK_STATUSES) as [string, ...string[]]);

export const createTaskSchema = z.object({
  relatedTo: z.object({
    entityType: z.enum(['LEAD', 'STUDENT', 'APPLICATION']),
    entityId: objectIdSchema,
  }),
  taskType: taskTypeSchema,
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  assignedToId: objectIdSchema,
  priority: prioritySchema.default('MEDIUM'),
  dueDate: z.string().datetime(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  taskType: taskTypeSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: objectIdSchema.optional(),
});

export const completeTaskSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

export const cancelTaskSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: taskStatusSchema.optional(),
  taskType: taskTypeSchema.optional(),
  priority: prioritySchema.optional(),
  branchId: objectIdSchema.optional(),
  assignedToId: objectIdSchema.optional(),
  entityType: z.enum(['LEAD', 'STUDENT', 'APPLICATION']).optional(),
  entityId: objectIdSchema.optional(),
  today: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
export type CompleteTaskDto = z.infer<typeof completeTaskSchema>;
export type CancelTaskDto = z.infer<typeof cancelTaskSchema>;
export type ListTasksQueryDto = z.infer<typeof listTasksQuerySchema>;