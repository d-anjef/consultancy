import type { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';
import { sendSuccess } from '../../lib/response.js';
import { NotFoundError } from '../../lib/errors.js';

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as {
        page: number;
        limit: number;
        actorId?: string;
        branchId?: string;
        action?: string;
        category?: string;
        entityType?: string;
        entityId?: string;
        startDate?: string;
        endDate?: string;
      };

      const result = await auditService.listAuditLogs(
        {
          actorId: query.actorId,
          branchId: query.branchId,
          action: query.action,
          category: query.category,
          entityType: query.entityType,
          entityId: query.entityId,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        },
        query.page,
        query.limit,
      );

      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditService.getAuditLogById(req.params.id!);
      if (!log) {
        throw new NotFoundError('Audit log', req.params.id);
      }
      sendSuccess(res, log);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();