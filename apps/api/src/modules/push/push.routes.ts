import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { subscribeSchema, unsubscribeSchema } from './push.validators.js';
import { pushController } from './push.controller.js';

const router: Router = Router();

router.post(
  '/subscribe',
  authorize(PERMISSION_CODES.VIEW_NOTIFICATION),
  validateBody(subscribeSchema),
  (req, res, next) => pushController.subscribe(req, res, next),
);

router.post(
  '/unsubscribe',
  authorize(PERMISSION_CODES.VIEW_NOTIFICATION),
  validateBody(unsubscribeSchema),
  (req, res, next) => pushController.unsubscribe(req, res, next),
);

router.post(
  '/test',
  authorize(PERMISSION_CODES.VIEW_NOTIFICATION),
  (req, res, next) => pushController.sendTest(req, res, next),
);

router.get(
  '/subscriptions',
  authorize(PERMISSION_CODES.VIEW_NOTIFICATION),
  (req, res, next) => pushController.listSubscriptions(req, res, next),
);

export { router as pushRoutes };