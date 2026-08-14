import { z } from 'zod';
import { objectIdSchema } from '@consultancy/validators';

const categorySchema = z.enum([
  'GRAMMAR',
  'VOCABULARY',
  'KANJI',
  'READING',
  'LISTENING',
  'SPEAKING',
  'WRITING',
  'CULTURE',
  'EXAM_PREP',
  'OTHER',
]);

export const uploadMaterialMetadataSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  category: categorySchema,
  languageLevelId: objectIdSchema.optional(),
  tags: z.array(z.string().trim().toLowerCase().max(50)).optional().default([]),
  isPublic: z.coerce.boolean().optional().default(true),
});

export const updateMaterialSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  category: categorySchema.optional(),
  languageLevelId: objectIdSchema.nullable().optional(),
  tags: z.array(z.string().trim().toLowerCase().max(50)).optional(),
  isPublic: z.boolean().optional(),
});

export const listMaterialsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: categorySchema.optional(),
  languageLevelId: objectIdSchema.optional(),
  search: z.string().trim().optional(),
  tags: z.string().trim().optional().transform((v) => (v ? v.split(',').map((s) => s.trim()) : undefined)),
});

export type UploadMaterialMetadataDto = z.infer<typeof uploadMaterialMetadataSchema>;
export type UpdateMaterialDto = z.infer<typeof updateMaterialSchema>;
export type ListMaterialsQueryDto = z.infer<typeof listMaterialsQuerySchema>;