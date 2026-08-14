import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../lib/errors.js';
import { PUBLIC_ROUTES } from '../../config/constants.js';

export interface SessionUser {
  id: string;
  email: string;
  role: {
    id: string;
    code: string;
    displayName: string;
    permissions: string[];
  };
  branch: {
    id: string;
    code: string;
    name: string;
  } | null;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  status: string;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    mfaPending?: boolean;
    mfaUserId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: SessionUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const isPublicRoute = PUBLIC_ROUTES.some((route: string) => req.path.startsWith(route));

  if (isPublicRoute) {
    next();
    return;
  }

  if (!req.session || !req.session.user) {
    next(new UnauthorizedError('Authentication required. Please log in.'));
    return;
  }

  if (req.session.user.status !== 'ACTIVE') {
    req.session.destroy(() => {});
    next(new UnauthorizedError('Your account is not active. Contact support.'));
    return;
  }

  req.currentUser = req.session.user;
  next();
}