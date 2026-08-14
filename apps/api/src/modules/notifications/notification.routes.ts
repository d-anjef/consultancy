import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import { notificationService } from './notification.service.js';
import { sendSuccess } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().trim().optional(),
});

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_NOTIFICATION),
  validateQuery(listQuerySchema),
  async (req, res, next) => {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const query = req.query as unknown as { page: number; limit: number; category?: string };
      const result = await notificationService.listForUser(
        req.currentUser.id,
        query.page,
        query.limit,
        query.category as never,
      );
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) { next(error); }
  },
);

router.get('/unread-count', async (req, res, next) => {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const count = await notificationService.getUnreadCount(req.currentUser.id);
    sendSuccess(res, { count });
  } catch (error) { next(error); }
});

router.patch(
  '/:id/read',
  authorize(PERMISSION_CODES.VIEW_NOTIFICATION),
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      await notificationService.markAsRead(req.params.id!, req.currentUser.id);
      sendSuccess(res, { message: 'Marked as read' });
    } catch (error) { next(error); }
  },
);

router.patch('/read-all', async (req, res, next) => {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    await notificationService.markAllAsRead(req.currentUser.id);
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (error) { next(error); }
});

export { router as notificationRoutes };