import { Types, type FilterQuery } from 'mongoose';
import {
  LearningMaterialModel,
  type LearningMaterialDocument,
  type MaterialCategory,
} from './learning-material.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';

const POPULATE = [
  { path: 'languageLevel', select: 'code name examType' },
  {
    path: 'uploadedBy',
    select: 'email profile.firstName profile.lastName',
  },
  { path: 'branch', select: 'code name' },
];

export interface CreateMaterialData {
  title: string;
  description?: string;
  category: MaterialCategory;
  languageLevel?: Types.ObjectId;
  tags?: string[];
  storage: LearningMaterialDocument['storage'];
  file: LearningMaterialDocument['file'];
  uploadedBy: Types.ObjectId;
  branch: Types.ObjectId;
  isPublic?: boolean;
}

export interface UpdateMaterialData {
  title?: string;
  description?: string;
  category?: MaterialCategory;
  languageLevel?: Types.ObjectId | null;
  tags?: string[];
  isPublic?: boolean;
}

export interface ListMaterialsFilter {
  category?: MaterialCategory;
  languageLevelId?: string;
  search?: string;
  tags?: string[];
}

export class LearningMaterialRepository {
  async findById(id: string): Promise<LearningMaterialDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return LearningMaterialModel.findById(id)
      .populate(POPULATE)
      .lean<LearningMaterialDocument | null>();
  }

  async create(data: CreateMaterialData): Promise<LearningMaterialDocument> {
    const created = await LearningMaterialModel.create(data);
    const populated = await LearningMaterialModel.findById(created._id)
      .populate(POPULATE)
      .lean<LearningMaterialDocument | null>();
    if (!populated) throw new Error('Failed to load created material');
    return populated;
  }

  async update(id: string, data: UpdateMaterialData): Promise<LearningMaterialDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};
    const unsetOps: Record<string, string> = {};

    if (data.title !== undefined) updateOps.title = data.title;
    if (data.description !== undefined) updateOps.description = data.description;
    if (data.category !== undefined) updateOps.category = data.category;
    if (data.tags !== undefined) updateOps.tags = data.tags;
    if (data.isPublic !== undefined) updateOps.isPublic = data.isPublic;

    if (data.languageLevel === null) unsetOps.languageLevel = '';
    else if (data.languageLevel !== undefined) updateOps.languageLevel = data.languageLevel;

    const update: Record<string, unknown> = { $set: updateOps };
    if (Object.keys(unsetOps).length > 0) update.$unset = unsetOps;

    return LearningMaterialModel.findByIdAndUpdate(id, update, { new: true })
      .populate(POPULATE)
      .lean<LearningMaterialDocument | null>();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await LearningMaterialModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async incrementDownload(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await LearningMaterialModel.updateOne(
      { _id: id },
      { $inc: { downloadCount: 1 } },
    );
  }

  async list(
    filter: ListMaterialsFilter,
    page: number,
    limit: number,
  ): Promise<{ items: LearningMaterialDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<LearningMaterialDocument> = { isPublic: true };

    if (filter.category) query.category = filter.category;
    if (filter.languageLevelId && Types.ObjectId.isValid(filter.languageLevelId)) {
      query.languageLevel = new Types.ObjectId(filter.languageLevelId);
    }
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }
    if (filter.search) {
      const s = filter.search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { tags: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LearningMaterialModel.find(query)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LearningMaterialDocument[]>(),
      LearningMaterialModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }
}

export const learningMaterialRepository = new LearningMaterialRepository();