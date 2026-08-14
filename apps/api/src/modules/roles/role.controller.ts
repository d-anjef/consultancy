import type { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';

export class RoleController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.listRoles();
      sendSuccess(res, roles);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.getRoleById(req.params.id!);
      sendSuccess(res, role);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.createRole(req.body);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'ROLE_CREATED',
        category: 'ROLE',
        entity: {
          type: 'ROLE',
          id: role.id,
          displayName: role.displayName,
        },
        changes: {
          after: {
            code: role.code,
            permissions: role.permissions,
          },
        },
      });

      sendCreated(res, role);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const before = await roleService.getRoleById(req.params.id!);
      const role = await roleService.updateRole(req.params.id!, req.body);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'ROLE_UPDATED',
        category: 'ROLE',
        entity: {
          type: 'ROLE',
          id: role.id,
          displayName: role.displayName,
        },
        changes: {
          before: {
            displayName: before.displayName,
            permissions: before.permissions,
          },
          after: {
            displayName: role.displayName,
            permissions: role.permissions,
          },
        },
      });

      sendSuccess(res, role);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.getRoleById(req.params.id!);
      await roleService.deleteRole(req.params.id!);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'ROLE_DELETED',
        category: 'ROLE',
        entity: {
          type: 'ROLE',
          id: role.id,
          displayName: role.displayName,
        },
        changes: {
          before: {
            code: role.code,
            permissions: role.permissions,
          },
        },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();