import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createCounselingSchema,
  updateCounselingSchema,
  rescheduleCounselingSchema,
  cancelCounselingSchema,
  attendCounselingSchema,
  noShowCounselingSchema,
  listCounselingQuerySchema,
} from './counseling.validators.js';
import { counselingController } from './counseling.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_COUNSELING),
  validateQuery(listCounselingQuerySchema),
  (req, res, next) => counselingController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_COUNSELING),
  validateParams(idParamSchema),
  (req, res, next) => counselingController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.CREATE_COUNSELING),
  validateBody(createCounselingSchema),
  (req, res, next) => counselingController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_COUNSELING),
  validateParams(idParamSchema),
  validateBody(updateCounselingSchema),
  (req, res, next) => counselingController.update(req, res, next),
);

router.post(
  '/:id/reschedule',
  authorize(PERMISSION_CODES.EDIT_COUNSELING),
  validateParams(idParamSchema),
  validateBody(rescheduleCounselingSchema),
  (req, res, next) => counselingController.reschedule(req, res, next),
);

router.post(
  '/:id/cancel',
  authorize(PERMISSION_CODES.CANCEL_COUNSELING),
  validateParams(idParamSchema),
  validateBody(cancelCounselingSchema),
  (req, res, next) => counselingController.cancel(req, res, next),
);

router.post(
  '/:id/attend',
  authorize(PERMISSION_CODES.RECORD_COUNSELING_OUTCOME),
  validateParams(idParamSchema),
  validateBody(attendCounselingSchema),
  (req, res, next) => counselingController.attend(req, res, next),
);

router.post(
  '/:id/no-show',
  authorize(PERMISSION_CODES.RECORD_COUNSELING_OUTCOME),
  validateParams(idParamSchema),
  validateBody(noShowCounselingSchema),
  (req, res, next) => counselingController.noShow(req, res, next),
);

export { router as counselingRoutes };