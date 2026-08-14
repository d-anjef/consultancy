import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createTemplateSchema,
  updateTemplateSchema,
  createJourneyForStudentSchema,
  updateMilestoneStatusSchema,
  updateMilestoneNotesSchema,
} from './journey.validators.js';
import { journeyController } from './journey.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });
const studentIdParamSchema = z.object({ studentId: objectIdSchema });
const journeyIdParamSchema = z.object({ journeyId: objectIdSchema });

// Student self-view
router.get(
  '/journey/me',
  authorize(PERMISSION_CODES.VIEW_OWN_STUDENT_PROFILE),
  (req, res, next) => journeyController.getOwnJourney(req, res, next),
);

// ─── Templates ─────────────────────────────────
router.get(
  '/templates',
  authorize(PERMISSION_CODES.VIEW_APPLICATION),
  (req, res, next) => journeyController.listTemplates(req, res, next),
);

router.get(
  '/templates/:id',
  authorize(PERMISSION_CODES.VIEW_APPLICATION),
  validateParams(idParamSchema),
  (req, res, next) => journeyController.getTemplateById(req, res, next),
);

router.post(
  '/templates',
  authorize(PERMISSION_CODES.MANAGE_SETTINGS),
  validateBody(createTemplateSchema),
  (req, res, next) => journeyController.createTemplate(req, res, next),
);

router.patch(
  '/templates/:id',
  authorize(PERMISSION_CODES.MANAGE_SETTINGS),
  validateParams(idParamSchema),
  validateBody(updateTemplateSchema),
  (req, res, next) => journeyController.updateTemplate(req, res, next),
);

router.delete(
  '/templates/:id',
  authorize(PERMISSION_CODES.MANAGE_SETTINGS),
  validateParams(idParamSchema),
  (req, res, next) => journeyController.deleteTemplate(req, res, next),
);

// ─── Student Journeys ─────────────────────────
router.get(
  '/journey/student/:studentId',
  authorize(PERMISSION_CODES.VIEW_STUDENT),
  validateParams(studentIdParamSchema),
  (req, res, next) => journeyController.getStudentJourney(req, res, next),
);

router.post(
  '/journey',
  authorize(PERMISSION_CODES.EDIT_STUDENT),
  validateBody(createJourneyForStudentSchema),
  (req, res, next) => journeyController.createJourney(req, res, next),
);

router.patch(
  '/journey/:journeyId/milestone-status',
  authorize(PERMISSION_CODES.EDIT_STUDENT),
  validateParams(journeyIdParamSchema),
  validateBody(updateMilestoneStatusSchema),
  (req, res, next) => journeyController.updateMilestoneStatus(req, res, next),
);

router.patch(
  '/journey/:journeyId/milestone-notes',
  authorize(PERMISSION_CODES.EDIT_STUDENT),
  validateParams(journeyIdParamSchema),
  validateBody(updateMilestoneNotesSchema),
  (req, res, next) => journeyController.updateMilestoneNotes(req, res, next),
);

export { router as journeyRoutes };