import { z } from 'zod';
import { ROLE_CODES } from '@consultancy/config';
import { emailSchema, objectIdSchema, phoneSchema } from './common.validators.js';

const roleCodeSchema = z.enum([
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.BRANCH_MANAGER,
  ROLE_CODES.COUNSELOR,
  ROLE_CODES.RECEPTIONIST,
  ROLE_CODES.TEACHER,
  ROLE_CODES.STUDENT,
]);

export const createUserSchema = z
  .object({
    email: emailSchema,
    roleCode: roleCodeSchema,
    branchId: objectIdSchema.optional(),
    profile: z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      phone: phoneSchema,
    }),
    sendInvitation: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // SUPER_ADMIN and ADMIN don't require branch
      if (data.roleCode === ROLE_CODES.SUPER_ADMIN || data.roleCode === ROLE_CODES.ADMIN) {
        return true;
      }
      // All other roles require branchId
      return !!data.branchId;
    },
    {
      message: 'Branch is required for this role',
      path: ['branchId'],
    },
  );

export const updateUserSchema = z.object({
  profile: z
    .object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      phone: phoneSchema.optional(),
      profilePhotoUrl: z.string().url().optional(),
      dateOfBirth: z.string().datetime().optional(),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    })
    .optional(),
  branchId: objectIdSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
});

export const updateOwnProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: phoneSchema.optional(),
  profilePhotoUrl: z.string().url().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  roleCode: roleCodeSchema.optional(),
  branchId: objectIdSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION']).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateOwnProfileDto = z.infer<typeof updateOwnProfileSchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;