import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { UnauthorizedError } from '../../lib/errors.js';
import {
  programService,
  createProgramSchema,
  updateProgramSchema,
} from './program.service.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

router.get('/', async (_req, res, next) => {
  try {
    const items = await programService.list();
    sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    sendSuccess(res, await programService.getById(req.params.id!));
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authorize(PERMISSION_CODES.MANAGE_PROGRAMS),
  validateBody(createProgramSchema),
  async (req, res, next) => {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const program = await programService.create(req.body, req.currentUser.id);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'PROGRAM_CREATED_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'PROGRAM', id: program.id, displayName: program.name },
      });
      sendCreated(res, program);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.MANAGE_PROGRAMS),
  validateParams(idParamSchema),
  validateBody(updateProgramSchema),
  async (req, res, next) => {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const program = await programService.update(req.params.id!, req.body, req.currentUser.id);
      await auditService.log({
        ...extractAuditContext(req),
        action: 'PROGRAM_CREATED_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'PROGRAM', id: program.id, displayName: program.name },
      });
      sendSuccess(res, program);
    } catch (error) {
      next(error);
    }
  },
);

export { router as programRoutes };