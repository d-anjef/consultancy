import { Types } from 'mongoose';
import {
  TASK_STATUSES,
  TASK_STATUS_TRANSITIONS,
  ORGANIZATION_WIDE_ROLE_CODES,
  type TaskStatus,
  type TaskType,
  type TaskPriority,
  type RoleCode,
} from '@consultancy/config';
import { taskRepository } from './task.repository.js';
import { userRepository } from '../users/user.repository.js';
import type { TaskDocument } from './task.model.js';
import type { UserDocument } from '../users/user.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import {
  BusinessRuleError,
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateTaskNumber } from '../../lib/studentId.js';
import type {
  CreateTaskDto,
  UpdateTaskDto,
  CompleteTaskDto,
  CancelTaskDto,
  ListTasksQueryDto,
} from './task.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedTask {
  id: string;
  taskNumber: string;
  branch: { id: string; code: string; name: string };
  relatedTo: { entityType: string; entityId: string };
  taskType: TaskType;
  title: string;
  description?: string;
  assignedTo: { id: string; email: string; firstName: string; lastName: string };
  priority: TaskPriority;
  dueDate: Date;
  status: TaskStatus;
  isOverdue: boolean;
  completedAt?: Date;
  completedBy?: { id: string; firstName: string; lastName: string } | null;
  completionNotes?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class TaskService {
  async list(
    query: ListTasksQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedTask[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await taskRepository.list(
      {
        branchId: branchFilter,
        assignedToId: query.assignedToId,
        status: query.status as TaskStatus | undefined,
        taskType: query.taskType as TaskType | undefined,
        priority: query.priority as TaskPriority | undefined,
        entityType: query.entityType,
        entityId: query.entityId,
        today: query.today,
        overdue: query.overdue,
        upcoming: query.upcoming,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((t) => this.format(t)), pagination };
  }

  async getById(id: string, actor: ActorContext): Promise<FormattedTask> {
    const task = await taskRepository.findById(id);
    if (!task) throw new NotFoundError('Task', id);
    this.enforceBranchAccess(task, actor);
    return this.format(task);
  }

  async create(data: CreateTaskDto, actor: ActorContext): Promise<FormattedTask> {
    const assignee = await userRepository.findById(data.assignedToId);
    if (!assignee) throw new NotFoundError('User', data.assignedToId);

    let branchId: Types.ObjectId;
    if (actor.branch) {
      branchId = new Types.ObjectId(actor.branch);
    } else if (assignee.branch) {
      branchId = assignee.branch as Types.ObjectId;
    } else {
      throw new BusinessRuleError('Cannot determine branch for task');
    }

    const taskNumber = await generateTaskNumber();

    const created = await taskRepository.create({
      taskNumber,
      branch: branchId,
      relatedTo: {
        entityType: data.relatedTo.entityType,
        entityId: new Types.ObjectId(data.relatedTo.entityId),
      },
      taskType: data.taskType as TaskType,
      title: data.title,
      description: data.description,
      assignedTo: new Types.ObjectId(data.assignedToId),
      priority: data.priority as TaskPriority,
      dueDate: new Date(data.dueDate),
      createdBy: new Types.ObjectId(actor.id),
    });

    return this.format(created);
  }

  async update(
    id: string,
    data: UpdateTaskDto,
    actor: ActorContext,
  ): Promise<FormattedTask> {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError('Task', id);
    this.enforceBranchAccess(existing, actor);

    if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
      throw new BusinessRuleError(`Cannot edit task in status: ${existing.status}`);
    }

    const updated = await taskRepository.update(id, {
      title: data.title,
      description: data.description,
      taskType: data.taskType as TaskType | undefined,
      priority: data.priority as TaskPriority | undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assignedTo: data.assignedToId ? new Types.ObjectId(data.assignedToId) : undefined,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Task', id);
    return this.format(updated);
  }

  async complete(
    id: string,
    data: CompleteTaskDto,
    actor: ActorContext,
  ): Promise<FormattedTask> {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError('Task', id);
    this.enforceBranchAccess(existing, actor);

    const allowed = TASK_STATUS_TRANSITIONS[existing.status as TaskStatus] ?? [];
    if (!allowed.includes(TASK_STATUSES.COMPLETED)) {
      throw new InvalidStateTransitionError('Task', existing.status, 'COMPLETED');
    }

    const updated = await taskRepository.complete(
      id,
      new Types.ObjectId(actor.id),
      data.notes,
    );
    if (!updated) throw new NotFoundError('Task', id);
    return this.format(updated);
  }

  async cancel(
    id: string,
    data: CancelTaskDto,
    actor: ActorContext,
  ): Promise<FormattedTask> {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError('Task', id);
    this.enforceBranchAccess(existing, actor);

    const allowed = TASK_STATUS_TRANSITIONS[existing.status as TaskStatus] ?? [];
    if (!allowed.includes(TASK_STATUSES.CANCELLED)) {
      throw new InvalidStateTransitionError('Task', existing.status, 'CANCELLED');
    }

    const updated = await taskRepository.cancel(
      id,
      new Types.ObjectId(actor.id),
      data.reason,
    );
    if (!updated) throw new NotFoundError('Task', id);
    return this.format(updated);
  }

  async getMyTaskCounts(actor: ActorContext) {
    return taskRepository.getTaskCounts(actor.id, actor.branch ?? undefined);
  }

  private enforceBranchAccess(task: TaskDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branchId = String((task.branch as unknown as BranchDocument)._id);
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this task's branch");
    }
  }

  private format(t: TaskDocument): FormattedTask {
    const branch = t.branch as unknown as BranchDocument;
    const assignee = t.assignedTo as unknown as UserDocument;
    const creator = t.createdBy as unknown as UserDocument;
    const completer = t.completedBy as unknown as UserDocument | undefined;

    const now = new Date();
    const isOverdue =
      t.dueDate < now &&
      (t.status === TASK_STATUSES.OPEN || t.status === TASK_STATUSES.IN_PROGRESS);

    return {
      id: String(t._id),
      taskNumber: t.taskNumber,
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      relatedTo: {
        entityType: t.relatedTo.entityType,
        entityId: String(t.relatedTo.entityId),
      },
      taskType: t.taskType,
      title: t.title,
      description: t.description,
      assignedTo: {
        id: String(assignee._id),
        email: assignee.email,
        firstName: assignee.profile.firstName,
        lastName: assignee.profile.lastName,
      },
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status,
      isOverdue,
      completedAt: t.completedAt,
      completedBy: completer
        ? {
            id: String(completer._id),
            firstName: completer.profile.firstName,
            lastName: completer.profile.lastName,
          }
        : null,
      completionNotes: t.completionNotes,
      cancelledAt: t.cancelledAt,
      cancellationReason: t.cancellationReason,
      createdBy: {
        id: String(creator._id),
        firstName: creator.profile.firstName,
        lastName: creator.profile.lastName,
      },
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}

export const taskService = new TaskService();