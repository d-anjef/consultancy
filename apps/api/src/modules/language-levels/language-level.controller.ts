import type { Request, Response, NextFunction } from 'express';
import { languageLevelService } from './language-level.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';

export class LanguageLevelController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const items = await languageLevelService.list(includeInactive);
      sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await languageLevelService.getById(req.params.id!));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const item = await languageLevelService.create(req.body, req.currentUser.id);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LANGUAGE_LEVEL_CREATED',
        category: 'SYSTEM',
        entity: { type: 'LANGUAGE_LEVEL', id: item.id, displayName: item.name },
      });

      sendCreated(res, item);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const item = await languageLevelService.update(
        req.params.id!,
        req.body,
        req.currentUser.id,
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LANGUAGE_LEVEL_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'LANGUAGE_LEVEL', id: item.id, displayName: item.name },
      });

      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await languageLevelService.getById(req.params.id!);
      await languageLevelService.delete(req.params.id!);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'LANGUAGE_LEVEL_DELETED',
        category: 'SYSTEM',
        entity: { type: 'LANGUAGE_LEVEL', id: item.id, displayName: item.name },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const languageLevelController = new LanguageLevelController();