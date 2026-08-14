import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { counselingService } from './counseling.service.js';
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

export class CounselingController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await counselingService.listCounseling(
        req.query as never,
        actorFromReq(req),
      );
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await counselingService.getCounselingById(req.params.id!, actorFromReq(req)),
      );
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counseling = await counselingService.createCounseling(
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'COUNSELING_CREATED',
        category: 'COUNSELING',
        entity: {
          type: 'COUNSELING',
          id: counseling.id,
          displayName: counseling.counselingNumber,
        },
      });
      sendCreated(res, counseling);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counseling = await counselingService.updateCounseling(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'COUNSELING_UPDATED',
        category: 'COUNSELING',
        entity: {
          type: 'COUNSELING',
          id: counseling.id,
          displayName: counseling.counselingNumber,
        },
      });
      sendSuccess(res, counseling);
    } catch (error) {
      next(error);
    }
  }

  async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counseling = await counselingService.rescheduleCounseling(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'COUNSELING_RESCHEDULED',
        category: 'COUNSELING',
        entity: {
          type: 'COUNSELING',
          id: counseling.id,
          displayName: counseling.counselingNumber,
        },
      });
      sendSuccess(res, counseling);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counseling = await counselingService.cancelCounseling(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'COUNSELING_CANCELLED',
        category: 'COUNSELING',
        entity: {
          type: 'COUNSELING',
          id: counseling.id,
          displayName: counseling.counselingNumber,
        },
      });
      sendSuccess(res, counseling);
    } catch (error) {
      next(error);
    }
  }

  async attend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counseling = await counselingService.markAttended(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'COUNSELING_OUTCOME_RECORDED',
        category: 'COUNSELING',
        entity: {
          type: 'COUNSELING',
          id: counseling.id,
          displayName: counseling.counselingNumber,
        },
      });
      sendSuccess(res, counseling);
    } catch (error) {
      next(error);
    }
  }

  async noShow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counseling = await counselingService.markNoShow(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'COUNSELING_OUTCOME_RECORDED',
        category: 'COUNSELING',
        entity: {
          type: 'COUNSELING',
          id: counseling.id,
          displayName: counseling.counselingNumber,
        },
      });
      sendSuccess(res, counseling);
    } catch (error) {
      next(error);
    }
  }
}

export const counselingController = new CounselingController();