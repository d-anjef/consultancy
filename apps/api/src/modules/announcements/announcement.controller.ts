import type { Request, Response, NextFunction } from 'express';
import { announcementService } from './announcement.service.js';
import type { RoleCode } from '@consultancy/config';

interface AuthedRequest extends Request {
  user?: {
    id: string;
    role: RoleCode;
    branch: string | null;
  };
}

export class AnnouncementController {
  async list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.list(req.query as never, req.user!);
      res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await announcementService.getById(id, req.user!);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.create(req.body, req.user!);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async preview(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const result = await announcementService.preview(req.body, req.user!);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const announcementController = new AnnouncementController();