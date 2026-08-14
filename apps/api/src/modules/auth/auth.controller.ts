import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError } from '../../lib/errors.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        'unknown';

      const result = await authService.login(req.body, ipAddress);

      if (result.requiresMfa) {
        sendSuccess(res, {
          requiresMfa: true,
          mfaMethod: result.mfaMethod,
          mfaSessionToken: result.mfaSessionToken,
        });
        return;
      }

      if (!result.sessionUser) {
        throw new UnauthorizedError('Login failed');
      }

      req.session.user = result.sessionUser;

      await auditService.log({
        actor: result.sessionUser.id,
        actorRole: result.sessionUser.role.code,
        branch: result.sessionUser.branch?.id ?? null,
        action: 'AUTH_LOGIN_SUCCESS',
        category: 'AUTH',
        entity: {
          type: 'USER',
          id: result.sessionUser.id,
          displayName: result.sessionUser.email,
        },
        requestId: req.requestId,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      sendSuccess(res, {
        requiresMfa: false,
        user: result.sessionUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        'unknown';

      const result = await authService.verifyMfa(req.body, ipAddress);

      req.session.user = result.sessionUser;

      await auditService.log({
        actor: result.sessionUser.id,
        actorRole: result.sessionUser.role.code,
        branch: result.sessionUser.branch?.id ?? null,
        action: 'AUTH_LOGIN_SUCCESS',
        category: 'AUTH',
        entity: {
          type: 'USER',
          id: result.sessionUser.id,
          displayName: result.sessionUser.email,
        },
        requestId: req.requestId,
        ipAddress,
        userAgent: req.headers['user-agent'],
        additionalContext: { mfa: true },
      });

      sendSuccess(res, { user: result.sessionUser });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.session.user;

      if (user) {
        await auditService.log({
          ...extractAuditContext(req),
          action: 'AUTH_LOGOUT',
          category: 'AUTH',
          entity: {
            type: 'USER',
            id: user.id,
            displayName: user.email,
          },
        });
      }

      req.session.destroy((err) => {
        if (err) {
          next(err);
          return;
        }
        res.clearCookie('consultancy_session');
        sendSuccess(res, { message: 'Logged out successfully' });
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body);

      await auditService.log({
        actor: 'system',
        actorRole: 'SYSTEM',
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        category: 'AUTH',
        entity: {
          type: 'USER',
          id: req.body.email,
          displayName: req.body.email,
        },
        requestId: req.requestId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      sendSuccess(res, {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);
      sendSuccess(res, { message: 'Password reset successfully. You may now log in.' });
    } catch (error) {
      next(error);
    }
  }

  async activateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.activateAccount(req.body);
      sendSuccess(res, { message: 'Account activated successfully. You may now log in.' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      await authService.changePassword(req.currentUser.id, req.body);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'AUTH_PASSWORD_CHANGED',
        category: 'AUTH',
        entity: {
          type: 'USER',
          id: req.currentUser.id,
          displayName: req.currentUser.email,
        },
      });

      sendSuccess(res, { message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const result = await authService.setupTotp(req.currentUser.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async verifyAndEnableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      const schema = z.object({
        method: z.enum(['TOTP', 'EMAIL_OTP']),
        secret: z.string().min(1),
        code: z.string().regex(/^\d{6}$/),
        backupCodes: z.array(z.string()).optional(),
      });

      const parsed = schema.parse(req.body);

      await authService.verifyAndEnableMfa(
        req.currentUser.id,
        parsed.method,
        parsed.secret,
        parsed.code,
        parsed.backupCodes,
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'AUTH_MFA_ENABLED',
        category: 'AUTH',
        entity: {
          type: 'USER',
          id: req.currentUser.id,
          displayName: req.currentUser.email,
        },
        additionalContext: { method: parsed.method },
      });

      sendSuccess(res, { message: 'MFA enabled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async disableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();

      await authService.disableMfa(req.currentUser.id, req.body.password);

      await auditService.log({
        ...extractAuditContext(req),
        action: 'AUTH_MFA_DISABLED',
        category: 'AUTH',
        entity: {
          type: 'USER',
          id: req.currentUser.id,
          displayName: req.currentUser.email,
        },
      });

      sendSuccess(res, { message: 'MFA disabled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const user = await authService.getMe(req.currentUser.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();