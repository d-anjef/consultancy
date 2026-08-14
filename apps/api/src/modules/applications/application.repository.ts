import { Types, type FilterQuery } from 'mongoose';
import {
  ApplicationModel,
  ApplicationStatusHistoryModel,
  type ApplicationDocument,
  type ApplicationStatusHistoryDocument,
} from './application.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import type { ApplicationStatus } from '@consultancy/config';

const APPLICATION_POPULATE = [
  {
    path: 'student',
    select: 'studentId personal.firstName personal.lastName contact.phone contact.email',
  },
  { path: 'branch', select: 'code name' },
  { path: 'visaCategory', select: 'code name' },
  { path: 'program', select: 'code name type' },
  {
    path: 'assignedCounselor',
    select: 'email profile.firstName profile.lastName',
  },
  {
    path: 'createdBy',
    select: 'email profile.firstName profile.lastName',
  },
];

export interface CreateApplicationData {
  applicationNumber: string;
  student: Types.ObjectId;
  branch: Types.ObjectId;
  visaCategory: Types.ObjectId;
  program: Types.ObjectId;
  schoolOrCompany: ApplicationDocument['schoolOrCompany'];
  intake: ApplicationDocument['intake'];
  assignedCounselor: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateApplicationData {
  schoolOrCompany?: Partial<ApplicationDocument['schoolOrCompany']>;
  intake?: Partial<ApplicationDocument['intake']>;
  assignedCounselor?: Types.ObjectId;
  deadlines?: Partial<ApplicationDocument['deadlines']>;
  notes?: string;
  updatedBy: Types.ObjectId;
}

export interface ListApplicationsFilter {
  branchId?: string;
  studentId?: string;
  status?: ApplicationStatus;
  visaCategoryId?: string;
  programId?: string;
  assignedCounselorId?: string;
  intakeYear?: number;
  isActive?: boolean;
}

export class ApplicationRepository {
  async findById(id: string): Promise<ApplicationDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return ApplicationModel.findById(id)
      .populate(APPLICATION_POPULATE)
      .lean<ApplicationDocument | null>();
  }

  async findByStudent(studentId: string): Promise<ApplicationDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) return [];
    return ApplicationModel.find({ student: new Types.ObjectId(studentId) })
      .populate(APPLICATION_POPULATE)
      .sort({ createdAt: -1 })
      .lean<ApplicationDocument[]>();
  }

  async findActiveByStudent(studentId: string): Promise<ApplicationDocument | null> {
    if (!Types.ObjectId.isValid(studentId)) return null;
    return ApplicationModel.findOne({
      student: new Types.ObjectId(studentId),
      isActive: true,
    })
      .populate(APPLICATION_POPULATE)
      .lean<ApplicationDocument | null>();
  }

  async create(data: CreateApplicationData): Promise<ApplicationDocument> {
    const app = await ApplicationModel.create(data);
    const populated = await ApplicationModel.findById(app._id)
      .populate(APPLICATION_POPULATE)
      .lean<ApplicationDocument | null>();
    if (!populated) throw new Error('Failed to load created application');
    return populated;
  }

  async update(id: string, data: UpdateApplicationData): Promise<ApplicationDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};
    if (data.schoolOrCompany) {
      for (const [k, v] of Object.entries(data.schoolOrCompany)) {
        if (v !== undefined) updateOps[`schoolOrCompany.${k}`] = v;
      }
    }
    if (data.intake) {
      for (const [k, v] of Object.entries(data.intake)) {
        if (v !== undefined) updateOps[`intake.${k}`] = v;
      }
    }
    if (data.deadlines) {
      for (const [k, v] of Object.entries(data.deadlines)) {
        if (v !== undefined) updateOps[`deadlines.${k}`] = v;
      }
    }
    if (data.assignedCounselor !== undefined) updateOps.assignedCounselor = data.assignedCounselor;
    if (data.notes !== undefined) updateOps.notes = data.notes;
    updateOps.updatedBy = data.updatedBy;

    return ApplicationModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(APPLICATION_POPULATE)
      .lean<ApplicationDocument | null>();
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    additional: Partial<ApplicationDocument>,
    updatedBy: Types.ObjectId,
  ): Promise<ApplicationDocument | null> {
    return ApplicationModel.findByIdAndUpdate(
      id,
      { $set: { status, ...additional, updatedBy } },
      { new: true },
    )
      .populate(APPLICATION_POPULATE)
      .lean<ApplicationDocument | null>();
  }

  async recordStatusChange(
    applicationId: Types.ObjectId,
    fromStatus: string | undefined,
    toStatus: string,
    changedBy: Types.ObjectId,
    reason?: string,
  ): Promise<void> {
    await ApplicationStatusHistoryModel.create({
      application: applicationId,
      fromStatus,
      toStatus,
      changedBy,
      changedAt: new Date(),
      reason,
    });
  }

  async getStatusHistory(applicationId: string): Promise<ApplicationStatusHistoryDocument[]> {
    if (!Types.ObjectId.isValid(applicationId)) return [];
    return ApplicationStatusHistoryModel.find({
      application: new Types.ObjectId(applicationId),
    })
      .populate('changedBy', 'email profile.firstName profile.lastName')
      .sort({ changedAt: -1 })
      .lean<ApplicationStatusHistoryDocument[]>();
  }

  async list(
    filter: ListApplicationsFilter,
    page: number,
    limit: number,
  ): Promise<{ items: ApplicationDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<ApplicationDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.studentId && Types.ObjectId.isValid(filter.studentId)) {
      query.student = new Types.ObjectId(filter.studentId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.visaCategoryId && Types.ObjectId.isValid(filter.visaCategoryId)) {
      query.visaCategory = new Types.ObjectId(filter.visaCategoryId);
    }
    if (filter.programId && Types.ObjectId.isValid(filter.programId)) {
      query.program = new Types.ObjectId(filter.programId);
    }
    if (filter.assignedCounselorId && Types.ObjectId.isValid(filter.assignedCounselorId)) {
      query.assignedCounselor = new Types.ObjectId(filter.assignedCounselorId);
    }
    if (filter.intakeYear) query['intake.year'] = filter.intakeYear;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ApplicationModel.find(query)
        .populate(APPLICATION_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ApplicationDocument[]>(),
      ApplicationModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }
}

export const applicationRepository = new ApplicationRepository();