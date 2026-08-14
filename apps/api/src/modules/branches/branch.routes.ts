import { Router } from 'express';
import { z } from 'zod';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import {
  createBranchSchema,
  updateBranchSchema,
  listBranchesQuerySchema,
  objectIdSchema,
} from '@consultancy/validators';
import { branchController } from './branch.controller.js';

const router: Router = Router();

const idParamSchema = z.object({ id: objectIdSchema });

router.get(
  '/',
  authorizeAny(PERMISSION_CODES.VIEW_ALL_BRANCHES, PERMISSION_CODES.VIEW_OWN_BRANCH),
  validateQuery(listBranchesQuerySchema),
  (req, res, next) => branchController.list(req, res, next),
);

router.get(
  '/active',
  authorizeAny(PERMISSION_CODES.VIEW_ALL_BRANCHES, PERMISSION_CODES.VIEW_OWN_BRANCH),
  (req, res, next) => branchController.listActive(req, res, next),
);

router.get(
  '/:id',
  authorizeAny(PERMISSION_CODES.VIEW_ALL_BRANCHES, PERMISSION_CODES.VIEW_OWN_BRANCH),
  validateParams(idParamSchema),
  (req, res, next) => branchController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.CREATE_BRANCH),
  validateBody(createBranchSchema),
  (req, res, next) => branchController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_BRANCH),
  validateParams(idParamSchema),
  validateBody(updateBranchSchema),
  (req, res, next) => branchController.update(req, res, next),
);

router.post(
  '/:id/deactivate',
  authorize(PERMISSION_CODES.MANAGE_BRANCH),
  validateParams(idParamSchema),
  (req, res, next) => branchController.deactivate(req, res, next),
);

export { router as branchRoutes };