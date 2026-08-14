import { Types, type FilterQuery } from 'mongoose';
import { TeacherProfileModel, type TeacherProfileDocument, type EmploymentType } from './teacher.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';

const POPULATE = [
  {
    path: 'userId',
    select: 'email profile.firstName profile.lastName profile.phone profile.profilePhotoUrl status',
  },
  { path: 'branch', select: 'code name' },
];

export interface CreateTeacherProfileData {
  userId: Types.ObjectId;
  branch: Types.ObjectId;
  employeeId: string;
  qualification?: string;
  specialization?: string[];
  experienceYears?: number;
  employmentType: EmploymentType;
  joinedDate: Date;
  bio?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateTeacherProfileData {
  qualification?: string;
  specialization?: string[];
  experienceYears?: number;
  employmentType?: EmploymentType;
  bio?: string;
  isActive?: boolean;
  updatedBy: Types.ObjectId;
}

export interface ListTeachersFilter {
  branchId?: string;
  search?: string;
  isActive?: boolean;
}

export class TeacherRepository {
  async findById(id: string): Promise<TeacherProfileDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return TeacherProfileModel.findById(id)
      .populate(POPULATE)
      .lean<TeacherProfileDocument | null>();
  }

  async findByUserId(userId: string): Promise<TeacherProfileDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return TeacherProfileModel.findOne({ userId: new Types.ObjectId(userId) })
      .populate(POPULATE)
      .lean<TeacherProfileDocument | null>();
  }

  async create(data: CreateTeacherProfileData): Promise<TeacherProfileDocument> {
    const created = await TeacherProfileModel.create(data);
    const populated = await TeacherProfileModel.findById(created._id)
      .populate(POPULATE)
      .lean<TeacherProfileDocument | null>();
    if (!populated) throw new Error('Failed to load created teacher profile');
    return populated;
  }

  async update(
    id: string,
    data: UpdateTeacherProfileData,
  ): Promise<TeacherProfileDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};
    if (data.qualification !== undefined) updateOps.qualification = data.qualification;
    if (data.specialization !== undefined) updateOps.specialization = data.specialization;
    if (data.experienceYears !== undefined) updateOps.experienceYears = data.experienceYears;
    if (data.employmentType !== undefined) updateOps.employmentType = data.employmentType;
    if (data.bio !== undefined) updateOps.bio = data.bio;
    if (data.isActive !== undefined) updateOps.isActive = data.isActive;
    updateOps.updatedBy = data.updatedBy;

    return TeacherProfileModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(POPULATE)
      .lean<TeacherProfileDocument | null>();
  }

  async list(
    filter: ListTeachersFilter,
    page: number,
    limit: number,
  ): Promise<{ items: TeacherProfileDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<TeacherProfileDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    if (filter.search) {
      const s = filter.search.trim();
      query.$or = [
        { employeeId: { $regex: s, $options: 'i' } },
        { qualification: { $regex: s, $options: 'i' } },
        { specialization: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      TeacherProfileModel.find(query)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<TeacherProfileDocument[]>(),
      TeacherProfileModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }
}

export const teacherRepository = new TeacherRepository();