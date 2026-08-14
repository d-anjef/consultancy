import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  updateMaterialSchema,
  listMaterialsQuerySchema,
} from './learning-material.validators.js';
import { learningMaterialController } from './learning-material.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// All authenticated users can view materials (teachers + students)
router.get(
  '/',
  validateQuery(listMaterialsQuerySchema),
  (req, res, next) => learningMaterialController.list(req, res, next),
);

router.get(
  '/:id',
  validateParams(idParamSchema),
  (req, res, next) => learningMaterialController.getById(req, res, next),
);

router.get(
  '/:id/download',
  validateParams(idParamSchema),
  (req, res, next) => learningMaterialController.download(req, res, next),
);

// Only teachers/admin can upload
router.post(
  '/upload',
  authorize(PERMISSION_CODES.VIEW_TEACHER),
  upload.single('file'),
  (req, res, next) => learningMaterialController.upload(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_TEACHER),
  validateParams(idParamSchema),
  validateBody(updateMaterialSchema),
  (req, res, next) => learningMaterialController.update(req, res, next),
);

router.delete(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_TEACHER),
  validateParams(idParamSchema),
  (req, res, next) => learningMaterialController.delete(req, res, next),
);

export { router as learningMaterialRoutes };