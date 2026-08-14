import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createApplicationSchema,
  updateApplicationSchema,
  changeApplicationStatusSchema,
  cancelApplicationSchema,
  listApplicationsQuerySchema,
} from './application.validators.js';
import { applicationController } from './application.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_APPLICATION),
  validateQuery(listApplicationsQuerySchema),
  (req, res, next) => applicationController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_APPLICATION),
  validateParams(idParamSchema),
  (req, res, next) => applicationController.getById(req, res, next),
);

router.get(
  '/:id/history',
  authorize(PERMISSION_CODES.VIEW_APPLICATION),
  validateParams(idParamSchema),
  (req, res, next) => applicationController.getHistory(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.CREATE_APPLICATION),
  validateBody(createApplicationSchema),
  (req, res, next) => applicationController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_APPLICATION),
  validateParams(idParamSchema),
  validateBody(updateApplicationSchema),
  (req, res, next) => applicationController.update(req, res, next),
);

router.post(
  '/:id/status',
  authorize(PERMISSION_CODES.CHANGE_APPLICATION_STATUS),
  validateParams(idParamSchema),
  validateBody(changeApplicationStatusSchema),
  (req, res, next) => applicationController.changeStatus(req, res, next),
);

router.post(
  '/:id/cancel',
  authorize(PERMISSION_CODES.CANCEL_APPLICATION),
  validateParams(idParamSchema),
  validateBody(cancelApplicationSchema),
  (req, res, next) => applicationController.cancel(req, res, next),
);

export { router as applicationRoutes };