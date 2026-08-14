import { Router } from 'express';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { reportController } from './report.controller.js';

const router: Router = Router();

router.get('/overview',
  authorize(PERMISSION_CODES.VIEW_REPORT),
  (req, res, next) => reportController.overview(req, res, next));

router.get('/leads',
  authorize(PERMISSION_CODES.VIEW_REPORT),
  (req, res, next) => reportController.leads(req, res, next));

router.get('/applications',
  authorize(PERMISSION_CODES.VIEW_REPORT),
  (req, res, next) => reportController.applications(req, res, next));

router.get('/finance',
  authorizeAny(PERMISSION_CODES.VIEW_REPORT, PERMISSION_CODES.VIEW_FINANCIAL_REPORTS),
  (req, res, next) => reportController.finance(req, res, next));

router.get('/attendance',
  authorizeAny(PERMISSION_CODES.VIEW_REPORT, PERMISSION_CODES.VIEW_ATTENDANCE_REPORTS),
  (req, res, next) => reportController.attendance(req, res, next));

export { router as reportRoutes };