import { Types, type FilterQuery } from 'mongoose';
import { AttendanceModel, type AttendanceDocument } from './attendance.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import { getStartOfDayUTC, getEndOfDayUTC } from '../../lib/timezone.js';
import type { PaginationMeta } from '@consultancy/types';
import type { AttendanceStatus, AttendanceMethod } from '@consultancy/config';

const POPULATE = [
  { path: 'user', select: 'email profile.firstName profile.lastName' },
  { path: 'branch', select: 'code name' },
  { path: 'class', select: 'classCode name' },
  { path: 'scannedBy', select: 'email profile.firstName profile.lastName' },
];

export interface CreateAttendanceData {
  user: Types.ObjectId;
  userType: 'STUDENT' | 'TEACHER';
  branch: Types.ObjectId;
  class?: Types.ObjectId;
  date: Date;
  scannedAt: Date;
  status: AttendanceStatus;
  method: AttendanceMethod;
  scannedBy: Types.ObjectId;
  scannerDevice?: string;
  notes?: string;
}

export interface ListAttendanceFilter {
  branchId?: string;
  userId?: string;
  userType?: 'STUDENT' | 'TEACHER';
  classId?: string;
  status?: AttendanceStatus;
  fromDate?: Date;
  toDate?: Date;
}

export class AttendanceRepository {
  async findById(id: string): Promise<AttendanceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AttendanceModel.findById(id)
      .populate(POPULATE)
      .lean<AttendanceDocument | null>();
  }

  async findByUserAndDate(
    userId: Types.ObjectId,
    date: Date,
  ): Promise<AttendanceDocument | null> {
    const dayStart = getStartOfDayUTC(date);
    const dayEnd = getEndOfDayUTC(date);
    return AttendanceModel.findOne({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd },
    })
      .populate(POPULATE)
      .lean<AttendanceDocument | null>();
  }

  async create(data: CreateAttendanceData): Promise<AttendanceDocument> {
    const created = await AttendanceModel.create(data);
    const populated = await AttendanceModel.findById(created._id)
      .populate(POPULATE)
      .lean<AttendanceDocument | null>();
    if (!populated) throw new Error('Failed to load created attendance');
    return populated;
  }

  async update(
    id: string,
    status: AttendanceStatus,
    editedBy: Types.ObjectId,
    editReason: string,
  ): Promise<AttendanceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AttendanceModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          editedBy,
          editedAt: new Date(),
          editReason,
        },
      },
      { new: true },
    )
      .populate(POPULATE)
      .lean<AttendanceDocument | null>();
  }

  async list(
    filter: ListAttendanceFilter,
    page: number,
    limit: number,
  ): Promise<{ items: AttendanceDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<AttendanceDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.userId && Types.ObjectId.isValid(filter.userId)) {
      query.user = new Types.ObjectId(filter.userId);
    }
    if (filter.userType) query.userType = filter.userType;
    if (filter.classId && Types.ObjectId.isValid(filter.classId)) {
      query.class = new Types.ObjectId(filter.classId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.fromDate || filter.toDate) {
      query.date = {};
      if (filter.fromDate) query.date.$gte = filter.fromDate;
      if (filter.toDate) query.date.$lte = filter.toDate;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AttendanceModel.find(query)
        .populate(POPULATE)
        .sort({ date: -1, scannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<AttendanceDocument[]>(),
      AttendanceModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }

  async getOwnAttendance(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AttendanceDocument[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const query: FilterQuery<AttendanceDocument> = {
      user: new Types.ObjectId(userId),
    };
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }
    return AttendanceModel.find(query)
      .populate(POPULATE)
      .sort({ date: -1 })
      .lean<AttendanceDocument[]>();
  }

  async getDailySummary(branchId: string, date: Date) {
    const dayStart = getStartOfDayUTC(date);
    const dayEnd = getEndOfDayUTC(date);
    const matchStage: FilterQuery<AttendanceDocument> = {
      date: { $gte: dayStart, $lte: dayEnd },
    };
    if (Types.ObjectId.isValid(branchId)) {
      matchStage.branch = new Types.ObjectId(branchId);
    }

    const results = await AttendanceModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { userType: '$userType', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary: Record<string, Record<string, number>> = {
      STUDENT: { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 },
      TEACHER: { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 },
    };

    for (const r of results) {
      const userType = r._id.userType;
      const status = r._id.status;
      if (summary[userType]) {
        summary[userType][status] = r.count;
      }
    }

    return summary;
  }
}

export const attendanceRepository = new AttendanceRepository();