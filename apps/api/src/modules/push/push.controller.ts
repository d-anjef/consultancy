import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { pushService } from './push.service.js';
import { UnauthorizedError } from '../../lib/errors.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

export class PushController {
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const userAgent = req.get('user-agent') ?? undefined;
      const subscription = await pushService.subscribe({
        userId: actor.id,
        endpoint: req.body.endpoint,
        keys: req.body.keys,
        userAgent,
      });
      res.status(201).json({
        success: true,
        data: {
          id: String(subscription._id),
          deviceType: subscription.deviceType,
          browser: subscription.browser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await pushService.unsubscribe(req.body.endpoint);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async sendTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      await pushService.sendTest(actor.id);
      res.json({ success: true, message: 'Test notification sent' });
    } catch (err) {
      next(err);
    }
  }

  async listSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = actorFromReq(req);
      const subs = await pushService.listUserSubscriptions(actor.id);
      res.json({ success: true, data: subs });
    } catch (err) {
      next(err);
    }
  }
}

export const pushController = new PushController();