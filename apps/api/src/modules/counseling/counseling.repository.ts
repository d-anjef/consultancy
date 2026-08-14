import { Types, type FilterQuery } from 'mongoose';
import { CounselingModel, type CounselingDocument } from './counseling.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import type { CounselingStatus } from '@consultancy/config';

const COUNSELING_POPULATE = [
  { path: 'lead', select: 'leadNumber personal status source' },
  { path: 'branch', select: 'code name' },
  { path: 'counselor', select: 'email profile.firstName profile.lastName' },
  { path: 'createdBy', select: 'email profile.firstName profile.lastName' },
];

export interface CreateCounselingData {
  counselingNumber: string;
  lead: Types.ObjectId;
  branch: Types.ObjectId;
  counselor: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  durationMinutes?: number;
  createdBy: Types.ObjectId;
}

export interface UpdateCounselingData {
  scheduledDate?: Date;
  scheduledTime?: string;
  durationMinutes?: number;
  counselor?: Types.ObjectId;
  followUpDate?: Date;
  updatedBy: Types.ObjectId;
}

export interface ListCounselingFilter {
  branchId?: string;
  counselorId?: string;
  leadId?: string;
  status?: CounselingStatus;
  fromDate?: Date;
  toDate?: Date;
}

export class CounselingRepository {
  async findById(id: string): Promise<CounselingDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return CounselingModel.findById(id)
      .populate(COUNSELING_POPULATE)
      .lean<CounselingDocument | null>();
  }

  async findConflicting(
    counselorId: Types.ObjectId,
    scheduledDate: Date,
    scheduledTime: string,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<CounselingDocument | null> {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const startMinutes = hours! * 60 + minutes!;
    const endMinutes = startMinutes + durationMinutes;

    const dayStart = new Date(scheduledDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const query: FilterQuery<CounselingDocument> = {
      counselor: counselorId,
      status: { $in: ['BOOKED', 'RESCHEDULED'] },
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
    };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const sameDay = await CounselingModel.find(query).lean<CounselingDocument[]>();
    for (const existing of sameDay) {
      const [eh, em] = existing.scheduledTime.split(':').map(Number);
      const existingStart = eh! * 60 + em!;
      const existingEnd = existingStart + existing.durationMinutes;
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return existing;
      }
    }
    return null;
  }

  async create(data: CreateCounselingData): Promise<CounselingDocument> {
    const counseling = await CounselingModel.create(data);
    const populated = await CounselingModel.findById(counseling._id)
      .populate(COUNSELING_POPULATE)
      .lean<CounselingDocument | null>();
    if (!populated) throw new Error('Failed to load created counseling');
    return populated;
  }

  async update(id: string, data: UpdateCounselingData): Promise<CounselingDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updateOps: Record<string, unknown> = {};
    if (data.scheduledDate !== undefined) updateOps.scheduledDate = data.scheduledDate;
    if (data.scheduledTime !== undefined) updateOps.scheduledTime = data.scheduledTime;
    if (data.durationMinutes !== undefined) updateOps.durationMinutes = data.durationMinutes;
    if (data.counselor !== undefined) updateOps.counselor = data.counselor;
    if (data.followUpDate !== undefined) updateOps.followUpDate = data.followUpDate;
    updateOps.updatedBy = data.updatedBy;

    return CounselingModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(COUNSELING_POPULATE)
      .lean<CounselingDocument | null>();
  }

  async recordReschedule(
    id: string,
    previousDate: Date,
    previousTime: string,
    newDate: Date,
    newTime: string,
    rescheduledBy: Types.ObjectId,
    reason: string | undefined,
  ): Promise<CounselingDocument | null> {
    return CounselingModel.findByIdAndUpdate(
      id,
      {
        $set: {
          scheduledDate: newDate,
          scheduledTime: newTime,
          status: 'BOOKED',
          updatedBy: rescheduledBy,
        },
        $push: {
          rescheduleHistory: {
            previousDate,
            previousTime,
            rescheduledAt: new Date(),
            rescheduledBy,
            reason,
          },
        },
      },
      { new: true },
    )
      .populate(COUNSELING_POPULATE)
      .lean<CounselingDocument | null>();
  }

  async cancel(
    id: string,
    reason: string | undefined,
    cancelledBy: Types.ObjectId,
  ): Promise<CounselingDocument | null> {
    return CounselingModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledBy,
          cancelledAt: new Date(),
          updatedBy: cancelledBy,
        },
      },
      { new: true },
    )
      .populate(COUNSELING_POPULATE)
      .lean<CounselingDocument | null>();
  }

  async recordOutcome(
    id: string,
    status: 'ATTENDED' | 'NO_SHOW',
    attendedAt: Date | undefined,
    outcome: CounselingDocument['outcome'] | undefined,
    followUpDate: Date | undefined,
    updatedBy: Types.ObjectId,
  ): Promise<CounselingDocument | null> {
    const updateOps: Record<string, unknown> = { status, updatedBy };
    if (attendedAt) updateOps.attendedAt = attendedAt;
    if (outcome) updateOps.outcome = outcome;
    if (followUpDate) updateOps.followUpDate = followUpDate;
    return CounselingModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(COUNSELING_POPULATE)
      .lean<CounselingDocument | null>();
  }

  async list(
    filter: ListCounselingFilter,
    page: number,
    limit: number,
  ): Promise<{ items: CounselingDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<CounselingDocument> = {};
    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.counselorId && Types.ObjectId.isValid(filter.counselorId)) {
      query.counselor = new Types.ObjectId(filter.counselorId);
    }
    if (filter.leadId && Types.ObjectId.isValid(filter.leadId)) {
      query.lead = new Types.ObjectId(filter.leadId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.fromDate || filter.toDate) {
      query.scheduledDate = {};
      if (filter.fromDate) query.scheduledDate.$gte = filter.fromDate;
      if (filter.toDate) query.scheduledDate.$lte = filter.toDate;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CounselingModel.find(query)
        .populate(COUNSELING_POPULATE)
        .sort({ scheduledDate: 1, scheduledTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean<CounselingDocument[]>(),
      CounselingModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }
}

export const counselingRepository = new CounselingRepository();