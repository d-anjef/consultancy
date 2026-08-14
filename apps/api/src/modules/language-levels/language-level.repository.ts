import { Types } from 'mongoose';
import {
  LanguageLevelModel,
  type LanguageLevelDocument,
  type ExamType,
} from './language-level.model.js';

export interface CreateLanguageLevelData {
  code: string;
  name: string;
  description?: string;
  examType: ExamType;
  order: number;
  durationMonths?: number;
  prerequisiteId?: Types.ObjectId;
  fee?: number;
  createdBy: Types.ObjectId;
}

export interface UpdateLanguageLevelData {
  name?: string;
  description?: string;
  examType?: ExamType;
  order?: number;
  durationMonths?: number;
  prerequisiteId?: Types.ObjectId | null;
  fee?: number;
  isActive?: boolean;
  updatedBy: Types.ObjectId;
}

const POPULATE = [{ path: 'prerequisiteId', select: 'code name' }];

export class LanguageLevelRepository {
  async list(includeInactive = false): Promise<LanguageLevelDocument[]> {
    const query = includeInactive ? {} : { isActive: true };
    return LanguageLevelModel.find(query)
      .populate(POPULATE)
      .sort({ examType: 1, order: 1, name: 1 })
      .lean<LanguageLevelDocument[]>();
  }

  async findById(id: string): Promise<LanguageLevelDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return LanguageLevelModel.findById(id)
      .populate(POPULATE)
      .lean<LanguageLevelDocument | null>();
  }

  async findByCode(code: string): Promise<LanguageLevelDocument | null> {
    return LanguageLevelModel.findOne({ code: code.toUpperCase() })
      .populate(POPULATE)
      .lean<LanguageLevelDocument | null>();
  }

  async create(data: CreateLanguageLevelData): Promise<LanguageLevelDocument> {
    const created = await LanguageLevelModel.create({
      ...data,
      code: data.code.toUpperCase(),
    });
    const populated = await LanguageLevelModel.findById(created._id)
      .populate(POPULATE)
      .lean<LanguageLevelDocument | null>();
    if (!populated) throw new Error('Failed to load created language level');
    return populated;
  }

  async update(
    id: string,
    data: UpdateLanguageLevelData,
  ): Promise<LanguageLevelDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};
    const unsetOps: Record<string, string> = {};

    if (data.name !== undefined) updateOps.name = data.name;
    if (data.description !== undefined) updateOps.description = data.description;
    if (data.examType !== undefined) updateOps.examType = data.examType;
    if (data.order !== undefined) updateOps.order = data.order;
    if (data.durationMonths !== undefined) updateOps.durationMonths = data.durationMonths;
    if (data.fee !== undefined) updateOps.fee = data.fee;
    if (data.isActive !== undefined) updateOps.isActive = data.isActive;
    updateOps.updatedBy = data.updatedBy;

    if (data.prerequisiteId === null) {
      unsetOps.prerequisiteId = '';
    } else if (data.prerequisiteId !== undefined) {
      updateOps.prerequisiteId = data.prerequisiteId;
    }

    const update: Record<string, unknown> = { $set: updateOps };
    if (Object.keys(unsetOps).length > 0) {
      update.$unset = unsetOps;
    }

    return LanguageLevelModel.findByIdAndUpdate(id, update, { new: true })
      .populate(POPULATE)
      .lean<LanguageLevelDocument | null>();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await LanguageLevelModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export const languageLevelRepository = new LanguageLevelRepository();