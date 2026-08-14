import { z } from 'zod';
import { ATTENDANCE_STATUSES} from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';

const attendanceStatusSchema = z.enum(Object.values(ATTENDANCE_STATUSES) as [string, ...string[]]);

export const scanAttendanceSchema = z.object({
  qrPayload: z.string().min(1, 'QR payload is required'),
  classId: objectIdSchema.optional(),
  scannerDevice: z.string().trim().optional(),
});

export const manualAttendanceSchema = z.object({
  userId: objectIdSchema,
  userType: z.enum(['STUDENT', 'TEACHER']),
  classId: objectIdSchema.optional(),
  status: attendanceStatusSchema.default('PRESENT'),
  date: z.string().datetime().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const editAttendanceSchema = z.object({
  status: attendanceStatusSchema,
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  branchId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  userType: z.enum(['STUDENT', 'TEACHER']).optional(),
  classId: objectIdSchema.optional(),
  status: attendanceStatusSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  date: z.string().datetime().optional(),
});

export type ScanAttendanceDto = z.infer<typeof scanAttendanceSchema>;
export type ManualAttendanceDto = z.infer<typeof manualAttendanceSchema>;
export type EditAttendanceDto = z.infer<typeof editAttendanceSchema>;
export type ListAttendanceQueryDto = z.infer<typeof listAttendanceQuerySchema>;