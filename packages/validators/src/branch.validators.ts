import { z } from 'zod';
import { addressSchema, emailSchema, objectIdSchema, phoneSchema } from './common.validators.js';

export const createBranchSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric')
    .min(3)
    .max(20),
  name: z.string().trim().min(1).max(200),
  address: addressSchema,
  phone: phoneSchema,
  email: emailSchema,
  timezone: z.string().trim().default('Asia/Kathmandu'),
  managerId: objectIdSchema.optional(),
});

export const updateBranchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  address: addressSchema.partial().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  managerId: objectIdSchema.optional(),
  isActive: z.boolean().optional(),
});

export const listBranchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateBranchDto = z.infer<typeof createBranchSchema>;
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;
export type ListBranchesQueryDto = z.infer<typeof listBranchesQuerySchema>;