import { Types } from 'mongoose';
import { z } from 'zod';
import { VisaCategoryModel, type VisaCategoryDocument } from './visa-category.model.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';

export const createVisaCategorySchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]+$/).min(3).max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  requiredDocumentTypes: z.array(z.string().trim()).optional().default([]),
});

export const updateVisaCategorySchema = createVisaCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateVisaCategoryDto = z.infer<typeof createVisaCategorySchema>;
export type UpdateVisaCategoryDto = z.infer<typeof updateVisaCategorySchema>;

export interface FormattedVisaCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  requiredDocumentTypes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class VisaCategoryService {
  async list(includeInactive = false): Promise<FormattedVisaCategory[]> {
    const query = includeInactive ? {} : { isActive: true };
    const items = await VisaCategoryModel.find(query)
      .sort({ name: 1 })
      .lean<VisaCategoryDocument[]>();
    return items.map((v) => this.format(v));
  }

  async getById(id: string): Promise<FormattedVisaCategory> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('Visa Category', id);
    const item = await VisaCategoryModel.findById(id).lean<VisaCategoryDocument | null>();
    if (!item) throw new NotFoundError('Visa Category', id);
    return this.format(item);
  }

  async create(data: CreateVisaCategoryDto, createdBy: string): Promise<FormattedVisaCategory> {
    const existing = await VisaCategoryModel.findOne({ code: data.code });
    if (existing) throw new ConflictError(`Visa category code "${data.code}" already exists`);
    const item = await VisaCategoryModel.create({
      ...data,
      createdBy: new Types.ObjectId(createdBy),
    });
    return this.format(item.toObject() as VisaCategoryDocument);
  }

  async update(
    id: string,
    data: UpdateVisaCategoryDto,
    updatedBy: string,
  ): Promise<FormattedVisaCategory> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('Visa Category', id);
    const updated = await VisaCategoryModel.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedBy: new Types.ObjectId(updatedBy) } },
      { new: true },
    ).lean<VisaCategoryDocument | null>();
    if (!updated) throw new NotFoundError('Visa Category', id);
    return this.format(updated);
  }

  private format(v: VisaCategoryDocument): FormattedVisaCategory {
    return {
      id: String(v._id),
      code: v.code,
      name: v.name,
      description: v.description,
      requiredDocumentTypes: v.requiredDocumentTypes ?? [],
      isActive: v.isActive,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }
}

export const visaCategoryService = new VisaCategoryService();