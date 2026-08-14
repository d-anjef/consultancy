import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';
import { loginRateLimiter, passwordResetRateLimiter } from '../../middleware/rateLimiter.js';
import { PERMISSION_CODES } from '@consultancy/config';
import {
  loginSchema,
  mfaVerifySchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  activateAccountSchema,
  disableMfaSchema,
} from '@consultancy/validators';
import { authController } from './auth.controller.js';

const router: Router = Router();

// Public endpoints
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  (req, res, next) => authController.login(req, res, next),
);

router.post(
  '/mfa/verify',
  validateBody(mfaVerifySchema),
  (req, res, next) => authController.verifyMfa(req, res, next),
);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateBody(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next),
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next),
);

router.post(
  '/activate',
  validateBody(activateAccountSchema),
  (req, res, next) => authController.activateAccount(req, res, next),
);

// Authenticated endpoints
router.post(
  '/logout',
  (req, res, next) => authController.logout(req, res, next),
);

router.get(
  '/me',
  (req, res, next) => authController.me(req, res, next),
);

router.post(
  '/change-password',
  authorize(PERMISSION_CODES.CHANGE_OWN_PASSWORD),
  validateBody(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next),
);

router.post(
  '/mfa/setup',
  authorize(PERMISSION_CODES.MANAGE_OWN_MFA),
  (req, res, next) => authController.setupMfa(req, res, next),
);

router.post(
  '/mfa/enable',
  authorize(PERMISSION_CODES.MANAGE_OWN_MFA),
  (req, res, next) => authController.verifyAndEnableMfa(req, res, next),
);

router.post(
  '/mfa/disable',
  authorize(PERMISSION_CODES.MANAGE_OWN_MFA),
  validateBody(disableMfaSchema),
  (req, res, next) => authController.disableMfa(req, res, next),
);

export { router as authRoutes };