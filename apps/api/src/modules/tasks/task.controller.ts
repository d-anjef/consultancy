import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { taskService } from './task.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class TaskController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await taskService.list(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await taskService.getById(req.params.id!, actorFromReq(req)));
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.create(req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'TASK_CREATED',
        category: 'TASK',
        entity: { type: 'TASK', id: task.id, displayName: task.taskNumber },
      });
      sendCreated(res, task);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.update(req.params.id!, req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'TASK_UPDATED',
        category: 'TASK',
        entity: { type: 'TASK', id: task.id, displayName: task.taskNumber },
      });
      sendSuccess(res, task);
    } catch (error) { next(error); }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.complete(req.params.id!, req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'TASK_COMPLETED',
        category: 'TASK',
        entity: { type: 'TASK', id: task.id, displayName: task.taskNumber },
      });
      sendSuccess(res, task);
    } catch (error) { next(error); }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.cancel(req.params.id!, req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'TASK_CANCELLED',
        category: 'TASK',
        entity: { type: 'TASK', id: task.id, displayName: task.taskNumber },
      });
      sendSuccess(res, task);
    } catch (error) { next(error); }
  }

  async myCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await taskService.getMyTaskCounts(actorFromReq(req)));
    } catch (error) { next(error); }
  }
}

export const taskController = new TaskController();