import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';
import {
  visaCategoryService,
  createVisaCategorySchema,
  updateVisaCategorySchema,
} from './visa-category.service.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get('/', async (_req, res, next) => {
  try {
    sendSuccess(res, await visaCategoryService.list());
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await visaCategoryService.getById(req.params.id!));
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authorize(PERMISSION_CODES.MANAGE_VISA_CATEGORIES),
  validateBody(createVisaCategorySchema),
  async (req, res, next) => {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const item = await visaCategoryService.create(req.body, req.currentUser.id);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'VISA_CATEGORY_CREATED_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'VISA_CATEGORY', id: item.id, displayName: item.name },
      });
      sendCreated(res, item);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_VISA_CATEGORIES),
  validateParams(idParamSchema),
  validateBody(updateVisaCategorySchema),
  async (req, res, next) => {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const item = await visaCategoryService.update(req.params.id!, req.body, req.currentUser.id);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'VISA_CATEGORY_CREATED_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'VISA_CATEGORY', id: item.id, displayName: item.name },
      });
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },
);

export { router as visaCategoryRoutes };