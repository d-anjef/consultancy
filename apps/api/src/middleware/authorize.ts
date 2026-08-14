import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import type { PermissionCode } from '@consultancy/config';

export function authorize(...requiredPermissions: PermissionCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.currentUser;

    if (!user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (requiredPermissions.length === 0) {
      next();
      return;
    }

    const userPermissions = new Set(user.role.permissions);

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      const missing = requiredPermissions.filter((p) => !userPermissions.has(p));
      next(
        new ForbiddenError(
          `Insufficient permissions. Missing: ${missing.join(', ')}`,
        ),
      );
      return;
    }

    next();
  };
}

export function authorizeAny(...requiredPermissions: PermissionCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.currentUser;

    if (!user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (requiredPermissions.length === 0) {
      next();
      return;
    }

    const userPermissions = new Set(user.role.permissions);

    const hasAnyPermission = requiredPermissions.some((permission) =>
      userPermissions.has(permission),
    );

    if (!hasAnyPermission) {
      next(
        new ForbiddenError(
          'You do not have any of the required permissions to perform this action.',
        ),
      );
      return;
    }

    next();
  };
}