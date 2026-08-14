import { z } from 'zod';
import { LEAD_STATUSES, LEAD_SOURCES } from '@consultancy/config';
import { emailSchema, objectIdSchema, phoneSchema } from '@consultancy/validators';

const leadSourceSchema = z.enum(Object.values(LEAD_SOURCES) as [string, ...string[]]);
const leadStatusSchema = z.enum(Object.values(LEAD_STATUSES) as [string, ...string[]]);

export const createLeadSchema = z.object({
  branchId: objectIdSchema,
  personal: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    middleName: z.string().trim().max(100).optional(),
    phone: phoneSchema,
    email: emailSchema.optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().datetime().optional(),
    occupation: z.string().trim().max(200).optional(),
  }),
  address: z.object({
    permanentAddress: z.string().trim().max(500).optional(),
    presentAddress: z.string().trim().max(500).optional(),
  }).optional(),
  education: z.object({
    lastEducation: z.enum(['10+2', 'BACHELOR', 'MASTER', 'OTHER']).optional(),
    faculty: z.string().trim().max(200).optional(),
    japaneseLanguageHistory: z.boolean().optional(),
    japanesePassedYear: z.string().trim().max(20).optional(),
    japaneseInstitute: z.string().trim().max(300).optional(),
  }).optional(),
  preference: z.object({
    preferredCollege: z.string().trim().max(300).optional(),
    periodOfStudy: z.string().trim().max(100).optional(),
    preferredIntake: z.enum(['APRIL', 'JULY', 'OCTOBER', 'JANUARY']).optional(),
    previousVisaApply: z.boolean().optional(),
  }).optional(),
  family: z.object({
    fatherName: z.string().trim().max(200).optional(),
    fatherPhone: z.string().trim().max(20).optional(),
    motherName: z.string().trim().max(200).optional(),
    motherPhone: z.string().trim().max(20).optional(),
  }).optional(),
  source: leadSourceSchema,
  sourceMetadata: z.object({
    formId: z.string().trim().optional(),
    referredBy: z.string().trim().optional(),
    utmSource: z.string().trim().optional(),
    utmCampaign: z.string().trim().optional(),
    externalRef: z.string().trim().optional(),
  }).optional(),
  interestedProgramId: objectIdSchema.optional(),
  interestedVisaCategoryId: objectIdSchema.optional(),
  preferredCounseling: z.object({
    date: z.string().datetime().optional(),
    time: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).optional(),
  }).optional(),
  assignedCounselorId: objectIdSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateLeadSchema = z.object({
  personal: z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    middleName: z.string().trim().max(100).optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().datetime().optional(),
    occupation: z.string().trim().max(200).optional(),
  }).optional(),
  address: z.object({
    permanentAddress: z.string().trim().max(500).optional(),
    presentAddress: z.string().trim().max(500).optional(),
  }).optional(),
  education: z.object({
    lastEducation: z.enum(['10+2', 'BACHELOR', 'MASTER', 'OTHER']).optional(),
    faculty: z.string().trim().max(200).optional(),
    japaneseLanguageHistory: z.boolean().optional(),
    japanesePassedYear: z.string().trim().max(20).optional(),
    japaneseInstitute: z.string().trim().max(300).optional(),
  }).optional(),
  preference: z.object({
    preferredCollege: z.string().trim().max(300).optional(),
    periodOfStudy: z.string().trim().max(100).optional(),
    preferredIntake: z.enum(['APRIL', 'JULY', 'OCTOBER', 'JANUARY']).optional(),
    previousVisaApply: z.boolean().optional(),
  }).optional(),
  family: z.object({
    fatherName: z.string().trim().max(200).optional(),
    fatherPhone: z.string().trim().max(20).optional(),
    motherName: z.string().trim().max(200).optional(),
    motherPhone: z.string().trim().max(20).optional(),
  }).optional(),
  interestedProgramId: objectIdSchema.optional(),
  interestedVisaCategoryId: objectIdSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export const assignLeadSchema = z.object({
  counselorId: objectIdSchema,
});

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  branchId: objectIdSchema.optional(),
  assignedCounselorId: objectIdSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export const leadIntakeSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  occupation: z.string().trim().max(200).optional(),
  permanentAddress: z.string().trim().max(500).optional(),
  presentAddress: z.string().trim().max(500).optional(),
  lastEducation: z.enum(['10+2', 'BACHELOR', 'MASTER', 'OTHER']).optional(),
  faculty: z.string().trim().max(200).optional(),
  japaneseLanguageHistory: z.boolean().optional(),
  japanesePassedYear: z.string().trim().max(20).optional(),
  japaneseInstitute: z.string().trim().max(300).optional(),
  preferredCollege: z.string().trim().max(300).optional(),
  periodOfStudy: z.string().trim().max(100).optional(),
  preferredIntake: z.enum(['APRIL', 'JULY', 'OCTOBER', 'JANUARY']).optional(),
  previousVisaApply: z.boolean().optional(),
  fatherName: z.string().trim().max(200).optional(),
  fatherPhone: z.string().trim().max(20).optional(),
  motherName: z.string().trim().max(200).optional(),
  motherPhone: z.string().trim().max(20).optional(),
  source: leadSourceSchema.default('GOOGLE_FORM'),
  branchCode: z.string().trim().toUpperCase().optional(),
  interestedProgram: z.string().trim().optional(),
  interestedVisaCategory: z.string().trim().optional(),
  preferredDate: z.string().datetime().optional(),
  preferredTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/).optional(),
  notes: z.string().trim().max(2000).optional(),
  formId: z.string().trim().optional(),
  externalRef: z.string().trim().optional(),
});

export type CreateLeadDto = z.infer<typeof createLeadSchema>;
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
export type UpdateLeadStatusDto = z.infer<typeof updateLeadStatusSchema>;
export type AssignLeadDto = z.infer<typeof assignLeadSchema>;
export type ListLeadsQueryDto = z.infer<typeof listLeadsQuerySchema>;
export type LeadIntakeDto = z.infer<typeof leadIntakeSchema>;