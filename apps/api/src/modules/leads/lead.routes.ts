import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  listLeadsQuerySchema,
  leadIntakeSchema,
} from './lead.validators.js';
import { leadController } from './lead.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

const intakeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/intake',
  intakeRateLimiter,
  validateBody(leadIntakeSchema),
  (req, res, next) => leadController.intake(req, res, next),
);

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_LEAD),
  validateQuery(listLeadsQuerySchema),
  (req, res, next) => leadController.list(req, res, next),
);

router.get(
  '/stats',
  authorize(PERMISSION_CODES.VIEW_LEAD),
  (req, res, next) => leadController.stats(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_LEAD),
  validateParams(idParamSchema),
  (req, res, next) => leadController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.CREATE_LEAD),
  validateBody(createLeadSchema),
  (req, res, next) => leadController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_LEAD),
  validateParams(idParamSchema),
  validateBody(updateLeadSchema),
  (req, res, next) => leadController.update(req, res, next),
);

router.post(
  '/:id/status',
  authorize(PERMISSION_CODES.EDIT_LEAD),
  validateParams(idParamSchema),
  validateBody(updateLeadStatusSchema),
  (req, res, next) => leadController.updateStatus(req, res, next),
);

router.post(
  '/:id/assign',
  authorize(PERMISSION_CODES.ASSIGN_LEAD),
  validateParams(idParamSchema),
  validateBody(assignLeadSchema),
  (req, res, next) => leadController.assign(req, res, next),
);

router.delete(
  '/:id',
  authorize(PERMISSION_CODES.DELETE_LEAD),
  validateParams(idParamSchema),
  (req, res, next) => leadController.delete(req, res, next),
);

export { router as leadRoutes };