import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createLanguageLevelSchema,
  updateLanguageLevelSchema,
} from './language-level.validators.js';
import { languageLevelController } from './language-level.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

// All authenticated users can view (used by dropdowns everywhere)
router.get('/', (req, res, next) => languageLevelController.list(req, res, next));

router.get(
  '/:id',
  validateParams(idParamSchema),
  (req, res, next) => languageLevelController.getById(req, res, next),
);

// Management requires system settings permission
router.post(
  '/',
  authorize(PERMISSION_CODES.MANAGE_SETTINGS),
  validateBody(createLanguageLevelSchema),
  (req, res, next) => languageLevelController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_SETTINGS),
  validateParams(idParamSchema),
  validateBody(updateLanguageLevelSchema),
  (req, res, next) => languageLevelController.update(req, res, next),
);

router.delete(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_SETTINGS),
  validateParams(idParamSchema),
  (req, res, next) => languageLevelController.delete(req, res, next),
);

export { router as languageLevelRoutes };