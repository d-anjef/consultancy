import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import {
  createRoleSchema,
  updateRoleSchema,
} from '@consultancy/validators';
import { z } from 'zod';
import { objectIdSchema } from '@consultancy/validators';
import { roleController } from './role.controller.js';

const router: Router = Router();

const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_USERS),
  (req, res, next) => roleController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_USERS),
  validateParams(idParamSchema),
  (req, res, next) => roleController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.MANAGE_ROLES),
  validateBody(createRoleSchema),
  (req, res, next) => roleController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_ROLES),
  validateParams(idParamSchema),
  validateBody(updateRoleSchema),
  (req, res, next) => roleController.update(req, res, next),
);

router.delete(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_ROLES),
  validateParams(idParamSchema),
  (req, res, next) => roleController.delete(req, res, next),
);

export { router as roleRoutes };