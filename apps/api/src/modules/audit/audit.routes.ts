import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { auditLogQuerySchema, objectIdSchema } from '@consultancy/validators';
import { auditController } from './audit.controller.js';

const router: Router = Router();

const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_AUDIT_LOG),
  validateQuery(auditLogQuerySchema),
  (req, res, next) => auditController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_AUDIT_LOG),
  validateParams(idParamSchema),
  (req, res, next) => auditController.getById(req, res, next),
);

export { router as auditRoutes };