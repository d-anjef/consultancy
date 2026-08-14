import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { ORGANIZATION_WIDE_ROLE_CODES, type RoleCode } from '@consultancy/config';

export function branchGuard(branchIdExtractor?: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.currentUser;

    if (!user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const roleCode = user.role.code as RoleCode;

    if (ORGANIZATION_WIDE_ROLE_CODES.includes(roleCode)) {
      next();
      return;
    }

    if (!user.branch) {
      next(new ForbiddenError('Your account is not assigned to any branch.'));
      return;
    }

    const requestedBranchId = branchIdExtractor
      ? branchIdExtractor(req)
      : extractBranchId(req);

    if (!requestedBranchId) {
      next();
      return;
    }

    if (requestedBranchId !== user.branch.id) {
      next(
        new ForbiddenError('You do not have access to this branch\'s data.'),
      );
      return;
    }

    next();
  };
}

function extractBranchId(req: Request): string | undefined {
  return (
    (req.params.branchId as string) ||
    (req.query.branchId as string) ||
    (req.body?.branchId as string) ||
    (req.body?.branch as string)
  );
}

export function injectBranchFilter(req: Request): Record<string, string> | Record<string, never> {
  const user = req.currentUser;

  if (!user) return {};

  const roleCode = user.role.code as RoleCode;

  if (ORGANIZATION_WIDE_ROLE_CODES.includes(roleCode)) {
    if (req.query.branchId) {
      return { branch: req.query.branchId as string };
    }
    return {};
  }

  if (user.branch) {
    return { branch: user.branch.id };
  }

  return {};
}