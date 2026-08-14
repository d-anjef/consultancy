import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  cancelTaskSchema,
  listTasksQuerySchema,
} from './task.validators.js';
import { taskController } from './task.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get('/counts', authorize(PERMISSION_CODES.VIEW_TASK),
  (req, res, next) => taskController.myCounts(req, res, next));

router.get('/', authorize(PERMISSION_CODES.VIEW_TASK),
  validateQuery(listTasksQuerySchema),
  (req, res, next) => taskController.list(req, res, next));

router.get('/:id', authorize(PERMISSION_CODES.VIEW_TASK),
  validateParams(idParamSchema),
  (req, res, next) => taskController.getById(req, res, next));

router.post('/', authorize(PERMISSION_CODES.CREATE_TASK),
  validateBody(createTaskSchema),
  (req, res, next) => taskController.create(req, res, next));

router.patch('/:id', authorize(PERMISSION_CODES.EDIT_TASK),
  validateParams(idParamSchema), validateBody(updateTaskSchema),
  (req, res, next) => taskController.update(req, res, next));

router.post('/:id/complete', authorize(PERMISSION_CODES.COMPLETE_TASK),
  validateParams(idParamSchema), validateBody(completeTaskSchema),
  (req, res, next) => taskController.complete(req, res, next));

router.post('/:id/cancel', authorize(PERMISSION_CODES.EDIT_TASK),
  validateParams(idParamSchema), validateBody(cancelTaskSchema),
  (req, res, next) => taskController.cancel(req, res, next));

export { router as taskRoutes };