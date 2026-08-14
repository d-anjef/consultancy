import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { classService } from './class.service.js';
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

export class ClassController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await classService.list(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await classService.getById(req.params.id!, actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const classes = await classService.getMyClasses(
        req.currentUser.id,
        req.currentUser.role.code as RoleCode,
      );
      sendSuccess(res, classes);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await classService.create(req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'CLASS_CREATED',
        category: 'SYSTEM',
        entity: { type: 'CLASS', id: cls.id, displayName: cls.classCode },
      });
      sendCreated(res, cls);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await classService.update(req.params.id!, req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'CLASS_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'CLASS', id: cls.id, displayName: cls.classCode },
      });
      sendSuccess(res, cls);
    } catch (error) {
      next(error);
    }
  }

  async enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await classService.enrollStudents(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'CLASS_ENROLLED',
        category: 'SYSTEM',
        entity: { type: 'CLASS', id: cls.id, displayName: cls.classCode },
        additionalContext: { count: req.body.studentIds.length },
      });
      sendSuccess(res, cls);
    } catch (error) {
      next(error);
    }
  }

  async unenroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await classService.unenrollStudents(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'CLASS_UNENROLLED',
        category: 'SYSTEM',
        entity: { type: 'CLASS', id: cls.id, displayName: cls.classCode },
        additionalContext: { count: req.body.studentIds.length },
      });
      sendSuccess(res, cls);
    } catch (error) {
      next(error);
    }
  }
}

export const classController = new ClassController();