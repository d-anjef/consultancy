import { Types, type FilterQuery } from 'mongoose';
import { TaskModel, type TaskDocument } from './task.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import { getStartOfDayUTC, getEndOfDayUTC } from '../../lib/timezone.js';
import type { PaginationMeta } from '@consultancy/types';
import type { TaskStatus, TaskType, TaskPriority } from '@consultancy/config';

const POPULATE = [
  { path: 'branch', select: 'code name' },
  { path: 'assignedTo', select: 'email profile.firstName profile.lastName' },
  { path: 'createdBy', select: 'email profile.firstName profile.lastName' },
  { path: 'completedBy', select: 'email profile.firstName profile.lastName' },
];

export interface CreateTaskData {
  taskNumber: string;
  branch: Types.ObjectId;
  relatedTo: { entityType: 'LEAD' | 'STUDENT' | 'APPLICATION'; entityId: Types.ObjectId };
  taskType: TaskType;
  title: string;
  description?: string;
  assignedTo: Types.ObjectId;
  priority: TaskPriority;
  dueDate: Date;
  createdBy: Types.ObjectId;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  taskType?: TaskType;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface ListTasksFilter {
  branchId?: string;
  assignedToId?: string;
  status?: TaskStatus;
  taskType?: TaskType;
  priority?: TaskPriority;
  entityType?: string;
  entityId?: string;
  today?: boolean;
  overdue?: boolean;
  upcoming?: boolean;
}

export class TaskRepository {
  async findById(id: string): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return TaskModel.findById(id).populate(POPULATE).lean<TaskDocument | null>();
  }

  async create(data: CreateTaskData): Promise<TaskDocument> {
    const created = await TaskModel.create(data);
    const populated = await TaskModel.findById(created._id)
      .populate(POPULATE)
      .lean<TaskDocument | null>();
    if (!populated) throw new Error('Failed to load created task');
    return populated;
  }

  async update(id: string, data: UpdateTaskData): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updateOps: Record<string, unknown> = {};
    if (data.title !== undefined) updateOps.title = data.title;
    if (data.description !== undefined) updateOps.description = data.description;
    if (data.taskType !== undefined) updateOps.taskType = data.taskType;
    if (data.priority !== undefined) updateOps.priority = data.priority;
    if (data.dueDate !== undefined) updateOps.dueDate = data.dueDate;
    if (data.assignedTo !== undefined) updateOps.assignedTo = data.assignedTo;
    updateOps.updatedBy = data.updatedBy;

    return TaskModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(POPULATE)
      .lean<TaskDocument | null>();
  }

  async complete(
    id: string,
    completedBy: Types.ObjectId,
    notes?: string,
  ): Promise<TaskDocument | null> {
    return TaskModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedBy,
          completionNotes: notes,
          updatedBy: completedBy,
        },
      },
      { new: true },
    )
      .populate(POPULATE)
      .lean<TaskDocument | null>();
  }

  async cancel(
    id: string,
    cancelledBy: Types.ObjectId,
    reason?: string,
  ): Promise<TaskDocument | null> {
    return TaskModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy,
          cancellationReason: reason,
          updatedBy: cancelledBy,
        },
      },
      { new: true },
    )
      .populate(POPULATE)
      .lean<TaskDocument | null>();
  }

  async list(
    filter: ListTasksFilter,
    page: number,
    limit: number,
  ): Promise<{ items: TaskDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<TaskDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.assignedToId && Types.ObjectId.isValid(filter.assignedToId)) {
      query.assignedTo = new Types.ObjectId(filter.assignedToId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.taskType) query.taskType = filter.taskType;
    if (filter.priority) query.priority = filter.priority;
    if (filter.entityType) query['relatedTo.entityType'] = filter.entityType;
    if (filter.entityId && Types.ObjectId.isValid(filter.entityId)) {
      query['relatedTo.entityId'] = new Types.ObjectId(filter.entityId);
    }

    if (filter.today) {
      query.dueDate = { $gte: getStartOfDayUTC(), $lte: getEndOfDayUTC() };
      query.status = { $in: ['OPEN', 'IN_PROGRESS'] };
    }
    if (filter.overdue) {
      query.dueDate = { $lt: getStartOfDayUTC() };
      query.status = { $in: ['OPEN', 'IN_PROGRESS'] };
    }
    if (filter.upcoming) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      query.dueDate = { $gte: getStartOfDayUTC(tomorrow), $lte: getEndOfDayUTC(weekLater) };
      query.status = { $in: ['OPEN', 'IN_PROGRESS'] };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      TaskModel.find(query)
        .populate(POPULATE)
        .sort({ priority: 1, dueDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean<TaskDocument[]>(),
      TaskModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }

  async getTaskCounts(assignedToId: string, branchId?: string) {
    const baseQuery: FilterQuery<TaskDocument> = {};
    if (Types.ObjectId.isValid(assignedToId)) {
      baseQuery.assignedTo = new Types.ObjectId(assignedToId);
    }
    if (branchId && Types.ObjectId.isValid(branchId)) {
      baseQuery.branch = new Types.ObjectId(branchId);
    }

    const now = getStartOfDayUTC();
    const endOfToday = getEndOfDayUTC();

    const [today, overdue, upcoming, total] = await Promise.all([
      TaskModel.countDocuments({
        ...baseQuery,
        dueDate: { $gte: now, $lte: endOfToday },
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
      }),
      TaskModel.countDocuments({
        ...baseQuery,
        dueDate: { $lt: now },
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
      }),
      TaskModel.countDocuments({
        ...baseQuery,
        dueDate: { $gt: endOfToday },
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
      }),
      TaskModel.countDocuments({
        ...baseQuery,
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
      }),
    ]);

    return { today, overdue, upcoming, total };
  }
}

export const taskRepository = new TaskRepository();