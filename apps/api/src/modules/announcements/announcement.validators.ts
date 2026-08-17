import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
  category: z.enum(['HOLIDAY', 'EVENT', 'NOTICE', 'GENERAL']).default('GENERAL'),
  audience: z.enum(['ALL_USERS', 'ALL_STUDENTS', 'ALL_STAFF', 'BY_BRANCH', 'BY_ROLE']),
  branchIds: z.array(z.string()).optional(),
  roleCodes: z.array(z.string()).optional(),
  includeStudents: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
  sendInApp: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.audience === 'BY_BRANCH') {
      return data.branchIds && data.branchIds.length > 0;
    }
    if (data.audience === 'BY_ROLE') {
      return data.roleCodes && data.roleCodes.length > 0;
    }
    return true;
  },
  { message: 'branchIds required for BY_BRANCH, roleCodes required for BY_ROLE' },
).refine(
  (data) => data.sendEmail || data.sendInApp,
  { message: 'At least one delivery channel (email or in-app) must be enabled' },
);

export const previewAnnouncementSchema = z.object({
  audience: z.enum(['ALL_USERS', 'ALL_STUDENTS', 'ALL_STAFF', 'BY_BRANCH', 'BY_ROLE']),
  branchIds: z.array(z.string()).optional(),
  roleCodes: z.array(z.string()).optional(),
  includeStudents: z.boolean().default(true),
});

export const listAnnouncementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'SENDING', 'SENT', 'FAILED']).optional(),
  category: z.enum(['HOLIDAY', 'EVENT', 'NOTICE', 'GENERAL']).optional(),
});

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
export type PreviewAnnouncementDto = z.infer<typeof previewAnnouncementSchema>;
export type ListAnnouncementsQueryDto = z.infer<typeof listAnnouncementsQuerySchema>;