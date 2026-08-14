import { z } from 'zod';
import { ALL_PERMISSION_CODES } from '@consultancy/config';

const permissionCodeSchema = z.enum(ALL_PERMISSION_CODES as [string, ...string[]]);

export const createRoleSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z_]+$/, 'Code must be uppercase with underscores only')
    .min(3)
    .max(50),
  displayName: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(permissionCodeSchema).min(1),
});

export const updateRoleSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(permissionCodeSchema).min(1).optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;