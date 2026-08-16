import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { userService } from './user.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';

export class UserController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const query = req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
        roleCode?: RoleCode;
        branchId?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
      };

      const result = await userService.listUsers(query, {
        role: req.currentUser.role.code,
        branch: req.currentUser.branch?.id ?? null,
        permissions: req.currentUser.role.permissions,
      });

      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id!);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const user = await userService.createUser(req.body, {
        id: req.currentUser.id,
        role: req.currentUser.role.code,
        branch: req.currentUser.branch?.id ?? null,
        permissions: req.currentUser.role.permissions,
      });

      await auditService.log({
        ...extractAuditContext(req),
        action: 'USER_CREATED',
        category: 'USER',
        entity: {
          type: 'USER',
          id: user.id,
          displayName: `${user.profile.firstName} ${user.profile.lastName}`,
        },
        changes: {
          after: {
            email: user.email,
            role: user.role.code,
            branch: user.branch?.name,
          },
        },
      });

      sendCreated(res, user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const before = await userService.getUserById(req.params.id!);
      const user = await userService.updateUser(req.params.id!, req.body, {
        id: req.currentUser.id,
        role: req.currentUser.role.code,
        branch: req.currentUser.branch?.id ?? null,
      });

      await auditService.log({
        ...extractAuditContext(req),
        action: 'USER_UPDATED',
        category: 'USER',
        entity: {
          type: 'USER',
          id: user.id,
          displayName: `${user.profile.firstName} ${user.profile.lastName}`,
        },
        changes: {
          before: {
            status: before.status,
            branch: before.branch?.name,
          },
          after: {
            status: user.status,
            branch: user.branch?.name,
          },
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const result = await userService.adminSetPassword(req.params.id!, req.body);

    await auditService.log({
      ...extractAuditContext(req),
      action: 'USER_PASSWORD_SET_BY_ADMIN',
      category: 'USER',
      entity: {
        type: 'USER',
        id: result.user.id,
        displayName: result.user.email,
      },
      additionalContext: { emailSent: result.emailSent },
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}


  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const user = await userService.deactivateUser(req.params.id!, req.currentUser.id);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'USER_DEACTIVATED',
        category: 'USER',
        entity: {
          type: 'USER',
          id: user.id,
          displayName: user.email,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const user = await userService.activateUser(req.params.id!, req.currentUser.id);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'USER_ACTIVATED',
        category: 'USER',
        entity: {
          type: 'USER',
          id: user.id,
          displayName: user.email,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.resendInvitation(req.params.id!);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'USER_INVITATION_SENT',
        category: 'USER',
        entity: {
          type: 'USER',
          id: req.params.id!,
        },
      });

      sendSuccess(res, { message: 'Invitation resent successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const user = await userService.getUserById(req.currentUser.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const user = await userService.updateOwnProfile(req.currentUser.id, req.body);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();