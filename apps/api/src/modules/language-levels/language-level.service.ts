import { Types } from 'mongoose';
import {
  languageLevelRepository,
} from './language-level.repository.js';
import type { LanguageLevelDocument, ExamType } from './language-level.model.js';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../lib/errors.js';
import type {
  CreateLanguageLevelDto,
  UpdateLanguageLevelDto,
} from './language-level.validators.js';

export interface FormattedLanguageLevel {
  id: string;
  code: string;
  name: string;
  description?: string;
  examType: ExamType;
  order: number;
  durationMonths?: number;
  prerequisite?: { id: string; code: string; name: string } | null;
  fee?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LanguageLevelService {
  async list(includeInactive = false): Promise<FormattedLanguageLevel[]> {
    const items = await languageLevelRepository.list(includeInactive);
    return items.map((l) => this.format(l));
  }

  async getById(id: string): Promise<FormattedLanguageLevel> {
    const item = await languageLevelRepository.findById(id);
    if (!item) throw new NotFoundError('Language Level', id);
    return this.format(item);
  }

  async create(
    data: CreateLanguageLevelDto,
    actorId: string,
  ): Promise<FormattedLanguageLevel> {
    const existing = await languageLevelRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Language level with code "${data.code}" already exists`);
    }

    if (data.prerequisiteId) {
      const prereq = await languageLevelRepository.findById(data.prerequisiteId);
      if (!prereq) throw new NotFoundError('Prerequisite Level', data.prerequisiteId);
    }

    const created = await languageLevelRepository.create({
      code: data.code,
      name: data.name,
      description: data.description,
      examType: data.examType,
      order: data.order,
      durationMonths: data.durationMonths,
      prerequisiteId: data.prerequisiteId
        ? new Types.ObjectId(data.prerequisiteId)
        : undefined,
      fee: data.fee,
      createdBy: new Types.ObjectId(actorId),
    });

    return this.format(created);
  }

  async update(
    id: string,
    data: UpdateLanguageLevelDto,
    actorId: string,
  ): Promise<FormattedLanguageLevel> {
    const existing = await languageLevelRepository.findById(id);
    if (!existing) throw new NotFoundError('Language Level', id);

    if (data.prerequisiteId) {
      if (String(data.prerequisiteId) === id) {
        throw new BusinessRuleError('A level cannot be its own prerequisite');
      }
      const prereq = await languageLevelRepository.findById(data.prerequisiteId);
      if (!prereq) throw new NotFoundError('Prerequisite Level', data.prerequisiteId);
    }

    const updated = await languageLevelRepository.update(id, {
      name: data.name,
      description: data.description,
      examType: data.examType,
      order: data.order,
      durationMonths: data.durationMonths,
      prerequisiteId:
        data.prerequisiteId === null
          ? null
          : data.prerequisiteId
          ? new Types.ObjectId(data.prerequisiteId)
          : undefined,
      fee: data.fee,
      isActive: data.isActive,
      updatedBy: new Types.ObjectId(actorId),
    });

    if (!updated) throw new NotFoundError('Language Level', id);
    return this.format(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await languageLevelRepository.findById(id);
    if (!existing) throw new NotFoundError('Language Level', id);
    // Note: In future, check no classes/students reference this level before allowing delete.
    // For MVP, just soft-delete via deactivation is preferred.
    await languageLevelRepository.delete(id);
  }

  private format(l: LanguageLevelDocument): FormattedLanguageLevel {
    const prereq = l.prerequisiteId as unknown as
      | { _id: Types.ObjectId; code: string; name: string }
      | undefined
      | null;

    return {
      id: String(l._id),
      code: l.code,
      name: l.name,
      description: l.description,
      examType: l.examType,
      order: l.order,
      durationMonths: l.durationMonths,
      prerequisite: prereq
        ? { id: String(prereq._id), code: prereq.code, name: prereq.name }
        : null,
      fee: l.fee,
      isActive: l.isActive,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }
}

export const languageLevelService = new LanguageLevelService();