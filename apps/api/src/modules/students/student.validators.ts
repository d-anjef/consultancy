import { z } from 'zod';
import { STUDENT_STATUSES } from '@consultancy/config';
import { addressSchema, emailSchema, objectIdSchema, phoneSchema } from '@consultancy/validators';

const studentStatusSchema = z.enum(Object.values(STUDENT_STATUSES) as [string, ...string[]]);

const personalSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional(),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  nationality: z.string().trim().min(1).max(100).default('Nepali'),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  fatherName: z.string().trim().max(100).optional(),
  motherName: z.string().trim().max(100).optional(),
});

const contactSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  alternatePhone: phoneSchema.optional(),
  address: addressSchema,
  permanentAddress: addressSchema.optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  relationship: z.string().trim().min(1).max(50),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: z.string().trim().max(500).optional(),
});

const passportSchema = z.object({
  number: z.string().trim().max(50).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  issuePlace: z.string().trim().max(100).optional(),
});

const educationSchema = z.object({
  highestQualification: z.string().trim().max(200).optional(),
  institution: z.string().trim().max(300).optional(),
  completionYear: z.number().int().min(1950).max(2100).optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export const createStudentSchema = z.object({
  branchId: objectIdSchema,
  fromLeadId: objectIdSchema.optional(),
  assignedCounselorId: objectIdSchema.optional(),
  personal: personalSchema,
  contact: contactSchema,
  emergencyContact: emergencyContactSchema,
  passport: passportSchema.optional(),
  education: educationSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  sendInvitation: z.boolean().optional().default(true),
  referredBy: objectIdSchema.optional(),
  referralRelationship: z.string().trim().max(100).optional(),
});

export const updateStudentSchema = z.object({
  personal: personalSchema.partial().optional(),
  contact: contactSchema.partial().optional(),
  emergencyContact: emergencyContactSchema.partial().optional(),
  passport: passportSchema.optional(),
  education: educationSchema.optional(),
  assignedCounselorId: objectIdSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Student self-edit — LIMITED FIELDS ONLY.
 * Enforces the STUDENT_EDITABLE_FIELDS rule.
 */
export const updateOwnStudentProfileSchema = z.object({
  contact: z
    .object({
      phone: phoneSchema.optional(),
      email: emailSchema.optional(),
      alternatePhone: phoneSchema.optional(),
      address: addressSchema.partial().optional(),
    })
    .optional(),
  emergencyContact: emergencyContactSchema.partial().optional(),
});

export const updateStudentStatusSchema = z.object({
  status: studentStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export const transferStudentBranchSchema = z.object({
  branchId: objectIdSchema,
  assignedCounselorId: objectIdSchema.optional(),
  reason: z.string().trim().max(500),
});

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: studentStatusSchema.optional(),
  branchId: objectIdSchema.optional(),
  assignedCounselorId: objectIdSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export type UpdateOwnStudentProfileDto = z.infer<typeof updateOwnStudentProfileSchema>;
export type UpdateStudentStatusDto = z.infer<typeof updateStudentStatusSchema>;
export type TransferStudentBranchDto = z.infer<typeof transferStudentBranchSchema>;
export type ListStudentsQueryDto = z.infer<typeof listStudentsQuerySchema>;