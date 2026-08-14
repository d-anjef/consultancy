import { Router } from 'express';
import { z } from 'zod';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  scanAttendanceSchema,
  manualAttendanceSchema,
  editAttendanceSchema,
  listAttendanceQuerySchema,
} from './attendance.validators.js';
import { attendanceController } from './attendance.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

// Own attendance
router.get(
  '/me',
  authorize(PERMISSION_CODES.VIEW_OWN_ATTENDANCE),
  (req, res, next) => attendanceController.getOwn(req, res, next),
);

// QR scan
router.post(
  '/scan',
  authorize(PERMISSION_CODES.SCAN_QR_ATTENDANCE),
  validateBody(scanAttendanceSchema),
  (req, res, next) => attendanceController.scan(req, res, next),
);

// Manual entry
router.post(
  '/manual',
  authorize(PERMISSION_CODES.RECORD_ATTENDANCE),
  validateBody(manualAttendanceSchema),
  (req, res, next) => attendanceController.manual(req, res, next),
);

// Edit
router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_ATTENDANCE),
  validateParams(idParamSchema),
  validateBody(editAttendanceSchema),
  (req, res, next) => attendanceController.edit(req, res, next),
);

// List
router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_ATTENDANCE),
  validateQuery(listAttendanceQuerySchema),
  (req, res, next) => attendanceController.list(req, res, next),
);

// Daily summary
router.get(
  '/daily-summary',
  authorizeAny(PERMISSION_CODES.VIEW_ATTENDANCE, PERMISSION_CODES.VIEW_ATTENDANCE_REPORTS),
  (req, res, next) => attendanceController.dailySummary(req, res, next),
);

export { router as attendanceRoutes };