import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { announcementService } from './announcement.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class AnnouncementController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await announcementService.list(req.query as never, actorFromReq(req));
      res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await announcementService.getById(req.params.id!, actorFromReq(req));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await announcementService.create(req.body, actorFromReq(req));
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await announcementService.preview(req.body, actorFromReq(req));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const announcementController = new AnnouncementController();