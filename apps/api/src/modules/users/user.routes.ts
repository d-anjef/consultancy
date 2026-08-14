import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import {
  createUserSchema,
  updateUserSchema,
  updateOwnProfileSchema,
  listUsersQuerySchema,
  objectIdSchema,
} from '@consultancy/validators';
import { userController } from './user.controller.js';

const router: Router = Router();

const idParamSchema = z.object({ id: objectIdSchema });

// Self routes
router.get(
  '/me/profile',
  authorize(PERMISSION_CODES.VIEW_OWN_PROFILE),
  (req, res, next) => userController.getMyProfile(req, res, next),
);

router.patch(
  '/me/profile',
  authorize(PERMISSION_CODES.EDIT_OWN_PROFILE),
  validateBody(updateOwnProfileSchema),
  (req, res, next) => userController.updateMyProfile(req, res, next),
);

// Staff routes
router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_USERS),
  validateQuery(listUsersQuerySchema),
  (req, res, next) => userController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_USERS),
  validateParams(idParamSchema),
  (req, res, next) => userController.getById(req, res, next),
);

router.post(
  '/',
  validateBody(createUserSchema),
  (req, res, next) => userController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_USER),
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  (req, res, next) => userController.update(req, res, next),
);

router.post(
  '/:id/deactivate',
  authorize(PERMISSION_CODES.DEACTIVATE_USER),
  validateParams(idParamSchema),
  (req, res, next) => userController.deactivate(req, res, next),
);

router.post(
  '/:id/activate',
  authorize(PERMISSION_CODES.EDIT_USER),
  validateParams(idParamSchema),
  (req, res, next) => userController.activate(req, res, next),
);

router.post(
  '/:id/resend-invitation',
  authorize(PERMISSION_CODES.EDIT_USER),
  validateParams(idParamSchema),
  (req, res, next) => userController.resendInvitation(req, res, next),
);

export { router as userRoutes };