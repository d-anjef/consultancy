import type { Request, Response, NextFunction } from 'express';
import { permissionService } from './permission.service.js';
import { sendSuccess } from '../../lib/response.js';

export class PermissionController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await permissionService.listAll();
      sendSuccess(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  async listGrouped(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grouped = await permissionService.listByCategory();
      sendSuccess(res, grouped);
    } catch (error) {
      next(error);
    }
  }
}

export const permissionController = new PermissionController();