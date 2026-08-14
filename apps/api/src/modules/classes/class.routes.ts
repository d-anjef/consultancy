import { Router } from 'express';
import { z } from 'zod';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createClassSchema,
  updateClassSchema,
  enrollStudentsSchema,
  listClassesQuerySchema,
} from './class.validators.js';
import { classController } from './class.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/me',
  authorizeAny(PERMISSION_CODES.VIEW_OWN_CLASSES, PERMISSION_CODES.VIEW_CLASS),
  (req, res, next) => classController.getMe(req, res, next),
);

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_CLASS),
  validateQuery(listClassesQuerySchema),
  (req, res, next) => classController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_CLASS),
  validateParams(idParamSchema),
  (req, res, next) => classController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.CREATE_CLASS),
  validateBody(createClassSchema),
  (req, res, next) => classController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_CLASS),
  validateParams(idParamSchema),
  validateBody(updateClassSchema),
  (req, res, next) => classController.update(req, res, next),
);

router.post(
  '/:id/enroll',
  authorize(PERMISSION_CODES.EDIT_CLASS),
  validateParams(idParamSchema),
  validateBody(enrollStudentsSchema),
  (req, res, next) => classController.enroll(req, res, next),
);

router.post(
  '/:id/unenroll',
  authorize(PERMISSION_CODES.EDIT_CLASS),
  validateParams(idParamSchema),
  validateBody(enrollStudentsSchema),
  (req, res, next) => classController.unenroll(req, res, next),
);

export { router as classRoutes };