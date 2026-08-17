import { Types, type FilterQuery } from 'mongoose';
import { ClassModel, type ClassDocument, type ClassStatus } from './class.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';

const POPULATE = [
  { path: 'branch', select: 'code name' },
  { path: 'program', select: 'code name type' },
  { path: 'languageLevel', select: 'code name examType' },
  {
    path: 'teacher',
    select: 'employeeId userId',
    populate: {
      path: 'userId',
      select: 'email profile.firstName profile.lastName',
    },
  },
  {
    path: 'students',
    select: 'studentId userId personal.firstName personal.lastName',  // ← added userId
  },
];

export interface CreateClassData {
  classCode: string;
  name: string;
  branch: Types.ObjectId;
  program?: Types.ObjectId;
  languageLevel?: Types.ObjectId;
  teacher: Types.ObjectId;
  schedule: ClassDocument['schedule'];
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateClassData {
  name?: string;
  program?: Types.ObjectId | null;
  languageLevel?: Types.ObjectId | null;
  teacher?: Types.ObjectId;
  schedule?: Partial<ClassDocument['schedule']>;
  endDate?: Date;
  status?: ClassStatus;
  notes?: string;
  updatedBy: Types.ObjectId;
}

export interface ListClassesFilter {
  branchId?: string;
  teacherId?: string;
  studentId?: string;
  languageLevelId?: string;
  status?: ClassStatus;
  search?: string;
}

export class ClassRepository {
  async findById(id: string): Promise<ClassDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return ClassModel.findById(id).populate(POPULATE).lean<ClassDocument | null>();
  }

  async findByTeacher(teacherId: string): Promise<ClassDocument[]> {
    if (!Types.ObjectId.isValid(teacherId)) return [];
    return ClassModel.find({ teacher: new Types.ObjectId(teacherId) })
      .populate(POPULATE)
      .sort({ startDate: -1 })
      .lean<ClassDocument[]>();
  }

  async findByStudent(studentId: string): Promise<ClassDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) return [];
    return ClassModel.find({ students: new Types.ObjectId(studentId) })
      .populate(POPULATE)
      .sort({ startDate: -1 })
      .lean<ClassDocument[]>();
  }

  async create(data: CreateClassData): Promise<ClassDocument> {
    const created = await ClassModel.create(data);
    const populated = await ClassModel.findById(created._id)
      .populate(POPULATE)
      .lean<ClassDocument | null>();
    if (!populated) throw new Error('Failed to load created class');
    return populated;
  }

  async update(id: string, data: UpdateClassData): Promise<ClassDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};
    const unsetOps: Record<string, string> = {};

    if (data.name !== undefined) updateOps.name = data.name;
    if (data.teacher !== undefined) updateOps.teacher = data.teacher;
    if (data.endDate !== undefined) updateOps.endDate = data.endDate;
    if (data.status !== undefined) updateOps.status = data.status;
    if (data.notes !== undefined) updateOps.notes = data.notes;
    updateOps.updatedBy = data.updatedBy;

    if (data.program === null) unsetOps.program = '';
    else if (data.program !== undefined) updateOps.program = data.program;

    if (data.languageLevel === null) unsetOps.languageLevel = '';
    else if (data.languageLevel !== undefined) updateOps.languageLevel = data.languageLevel;

    if (data.schedule) {
      for (const [k, v] of Object.entries(data.schedule)) {
        if (v !== undefined) updateOps[`schedule.${k}`] = v;
      }
    }

    const update: Record<string, unknown> = { $set: updateOps };
    if (Object.keys(unsetOps).length > 0) update.$unset = unsetOps;

    return ClassModel.findByIdAndUpdate(id, update, { new: true })
      .populate(POPULATE)
      .lean<ClassDocument | null>();
  }

  async enrollStudents(id: string, studentIds: Types.ObjectId[]): Promise<ClassDocument | null> {
    return ClassModel.findByIdAndUpdate(
      id,
      { $addToSet: { students: { $each: studentIds } } },
      { new: true },
    )
      .populate(POPULATE)
      .lean<ClassDocument | null>();
  }

  async unenrollStudents(id: string, studentIds: Types.ObjectId[]): Promise<ClassDocument | null> {
    return ClassModel.findByIdAndUpdate(
      id,
      { $pull: { students: { $in: studentIds } } },
      { new: true },
    )
      .populate(POPULATE)
      .lean<ClassDocument | null>();
  }

  async list(
    filter: ListClassesFilter,
    page: number,
    limit: number,
  ): Promise<{ items: ClassDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<ClassDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.teacherId && Types.ObjectId.isValid(filter.teacherId)) {
      query.teacher = new Types.ObjectId(filter.teacherId);
    }
    if (filter.studentId && Types.ObjectId.isValid(filter.studentId)) {
      query.students = new Types.ObjectId(filter.studentId);
    }
    if (filter.languageLevelId && Types.ObjectId.isValid(filter.languageLevelId)) {
      query.languageLevel = new Types.ObjectId(filter.languageLevelId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.search) {
      const s = filter.search.trim();
      query.$or = [
        { classCode: { $regex: s, $options: 'i' } },
        { name: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ClassModel.find(query)
        .populate(POPULATE)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ClassDocument[]>(),
      ClassModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }
}

export const classRepository = new ClassRepository();