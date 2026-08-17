import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createAnnouncementSchema,
  previewAnnouncementSchema,
  listAnnouncementsQuerySchema,
} from './announcement.validators.js';
import { announcementController } from './announcement.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/',
  authorize(PERMISSION_CODES.SEND_NOTIFICATION),
  validateQuery(listAnnouncementsQuerySchema),
  (req, res, next) => announcementController.list(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.SEND_NOTIFICATION),
  validateParams(idParamSchema),
  (req, res, next) => announcementController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.SEND_NOTIFICATION),
  validateBody(createAnnouncementSchema),
  (req, res, next) => announcementController.create(req, res, next),
);

router.post(
  '/preview',
  authorize(PERMISSION_CODES.SEND_NOTIFICATION),
  validateBody(previewAnnouncementSchema),
  (req, res, next) => announcementController.preview(req, res, next),
);

export { router as announcementRoutes };