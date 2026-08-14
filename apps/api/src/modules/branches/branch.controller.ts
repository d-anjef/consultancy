import type { Request, Response, NextFunction } from 'express';
import { branchService } from './branch.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';

export class BranchController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
        isActive?: boolean;
      };

      const result = await branchService.listBranches(query);
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async listActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await branchService.listActiveBranches();
      sendSuccess(res, branches);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branch = await branchService.getBranchById(req.params.id!);
      sendSuccess(res, branch);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const branch = await branchService.createBranch(req.body, req.currentUser.id);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'BRANCH_CREATED',
        category: 'BRANCH',
        entity: {
          type: 'BRANCH',
          id: branch.id,
          displayName: branch.name,
        },
        changes: {
          after: {
            code: branch.code,
            name: branch.name,
          },
        },
      });

      sendCreated(res, branch);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const before = await branchService.getBranchById(req.params.id!);
      const branch = await branchService.updateBranch(
        req.params.id!,
        req.body,
        req.currentUser.id,
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'BRANCH_UPDATED',
        category: 'BRANCH',
        entity: {
          type: 'BRANCH',
          id: branch.id,
          displayName: branch.name,
        },
        changes: {
          before: {
            name: before.name,
            isActive: before.isActive,
          },
          after: {
            name: branch.name,
            isActive: branch.isActive,
          },
        },
      });

      sendSuccess(res, branch);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const branch = await branchService.deactivateBranch(
        req.params.id!,
        req.currentUser.id,
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'BRANCH_DEACTIVATED',
        category: 'BRANCH',
        entity: {
          type: 'BRANCH',
          id: branch.id,
          displayName: branch.name,
        },
      });

      sendSuccess(res, branch);
    } catch (error) {
      next(error);
    }
  }
}

export const branchController = new BranchController();