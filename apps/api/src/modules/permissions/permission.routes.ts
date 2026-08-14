import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { permissionController } from './permission.controller.js';

const router: Router = Router();

router.get(
  '/',
  authorize(PERMISSION_CODES.MANAGE_ROLES),
  (req, res, next) => permissionController.list(req, res, next),
);

router.get(
  '/grouped',
  authorize(PERMISSION_CODES.MANAGE_ROLES),
  (req, res, next) => permissionController.listGrouped(req, res, next),
);

export { router as permissionRoutes };