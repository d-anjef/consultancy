import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { applicationService } from './application.service.js';
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

export class ApplicationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await applicationService.list(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await applicationService.getById(req.params.id!, actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await applicationService.getStatusHistory(req.params.id!, actorFromReq(req));
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const app = await applicationService.create(req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'APPLICATION_CREATED',
        category: 'APPLICATION',
        entity: { type: 'APPLICATION', id: app.id, displayName: app.applicationNumber },
        changes: {
          after: {
            student: app.student.studentId,
            visa: app.visaCategory.code,
            program: app.program.code,
          },
        },
      });
      sendCreated(res, app);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const app = await applicationService.update(req.params.id!, req.body, actor);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'APPLICATION_UPDATED',
        category: 'APPLICATION',
        entity: { type: 'APPLICATION', id: app.id, displayName: app.applicationNumber },
      });
      sendSuccess(res, app);
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const before = await applicationService.getById(req.params.id!, actor);
      const app = await applicationService.changeStatus(req.params.id!, req.body, actor);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'APPLICATION_STATUS_CHANGED',
        category: 'APPLICATION',
        entity: { type: 'APPLICATION', id: app.id, displayName: app.applicationNumber },
        changes: {
          before: { status: before.status },
          after: { status: app.status },
        },
        additionalContext: { reason: req.body.reason },
      });

      sendSuccess(res, app);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const app = await applicationService.cancel(req.params.id!, req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'APPLICATION_CANCELLED',
        category: 'APPLICATION',
        entity: { type: 'APPLICATION', id: app.id, displayName: app.applicationNumber },
        additionalContext: { reason: req.body.reason },
      });
      sendSuccess(res, app);
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();