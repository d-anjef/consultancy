import { Types } from 'mongoose';
import { z } from 'zod';
import { ProgramModel, type ProgramDocument } from './program.model.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';

export const createProgramSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]+$/).min(3).max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(['LANGUAGE_SCHOOL', 'UNIVERSITY', 'VOCATIONAL', 'WORKING', 'OTHER']),
  durationMonths: z.number().int().min(1).max(120).optional(),
});

export const updateProgramSchema = createProgramSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateProgramDto = z.infer<typeof createProgramSchema>;
export type UpdateProgramDto = z.infer<typeof updateProgramSchema>;

export interface FormattedProgram {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  durationMonths?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ProgramService {
  async list(includeInactive = false): Promise<FormattedProgram[]> {
    const query = includeInactive ? {} : { isActive: true };
    const programs = await ProgramModel.find(query)
      .sort({ type: 1, name: 1 })
      .lean<ProgramDocument[]>();
    return programs.map((p) => this.format(p));
  }

  async getById(id: string): Promise<FormattedProgram> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('Program', id);
    const program = await ProgramModel.findById(id).lean<ProgramDocument | null>();
    if (!program) throw new NotFoundError('Program', id);
    return this.format(program);
  }

  async create(data: CreateProgramDto, createdBy: string): Promise<FormattedProgram> {
    const existing = await ProgramModel.findOne({ code: data.code });
    if (existing) throw new ConflictError(`Program code "${data.code}" already exists`);

    const program = await ProgramModel.create({
      ...data,
      createdBy: new Types.ObjectId(createdBy),
    });
    return this.format(program.toObject() as ProgramDocument);
  }

  async update(id: string, data: UpdateProgramDto, updatedBy: string): Promise<FormattedProgram> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('Program', id);

    const updated = await ProgramModel.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedBy: new Types.ObjectId(updatedBy) } },
      { new: true },
    ).lean<ProgramDocument | null>();

    if (!updated) throw new NotFoundError('Program', id);
    return this.format(updated);
  }

  private format(p: ProgramDocument): FormattedProgram {
    return {
      id: String(p._id),
      code: p.code,
      name: p.name,
      description: p.description,
      type: p.type,
      durationMonths: p.durationMonths,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}

export const programService = new ProgramService();