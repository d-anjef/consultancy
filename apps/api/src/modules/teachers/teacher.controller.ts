import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { teacherService } from './teacher.service.js';
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

export class TeacherController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await teacherService.listTeachers(req.query as never, actorFromReq(req));
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await teacherService.getById(req.params.id!, actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      sendSuccess(res, await teacherService.getMyProfile(req.currentUser.id));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacher = await teacherService.createProfile(req.body, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'TEACHER_PROFILE_CREATED',
        category: 'USER',
        entity: {
          type: 'TEACHER',
          id: teacher.id,
          displayName: `${teacher.employeeId} — ${teacher.user.firstName} ${teacher.user.lastName}`,
        },
      });
      sendCreated(res, teacher);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacher = await teacherService.updateProfile(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'TEACHER_PROFILE_UPDATED',
        category: 'USER',
        entity: { type: 'TEACHER', id: teacher.id, displayName: teacher.employeeId },
      });
      sendSuccess(res, teacher);
    } catch (error) {
      next(error);
    }
  }
}

export const teacherController = new TeacherController();