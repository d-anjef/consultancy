import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createTeacherProfileSchema,
  updateTeacherProfileSchema,
  listTeachersQuerySchema,
} from './teacher.validators.js';
import { teacherController } from './teacher.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/me',
  (req, res, next) => teacherController.getMe(req, res, next),
);

router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_TEACHER),
  validateQuery(listTeachersQuerySchema),
  (req, res, next) => teacherController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_TEACHER),
  validateParams(idParamSchema),
  (req, res, next) => teacherController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.MANAGE_TEACHER),
  validateBody(createTeacherProfileSchema),
  (req, res, next) => teacherController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_TEACHER),
  validateParams(idParamSchema),
  validateBody(updateTeacherProfileSchema),
  (req, res, next) => teacherController.update(req, res, next),
);

export { router as teacherRoutes };