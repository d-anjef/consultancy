import { Router } from 'express';
import { z } from 'zod';
import { authorize, authorizeAny } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createInvoiceSchema,
  createPaymentSchema,
  voidPaymentSchema,
  listInvoicesQuerySchema,
  listPaymentsQuerySchema,
} from './finance.validators.js';
import { financeController } from './finance.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

// Student self routes
router.get(
  '/invoices/me',
  authorize(PERMISSION_CODES.VIEW_OWN_FEES),
  (req, res, next) => financeController.myInvoices(req, res, next),
);

router.get(
  '/payments/me',
  authorize(PERMISSION_CODES.VIEW_OWN_FEES),
  (req, res, next) => financeController.myPayments(req, res, next),
);

// Stats
router.get(
  '/stats',
  authorizeAny(PERMISSION_CODES.VIEW_FINANCE, PERMISSION_CODES.VIEW_FINANCIAL_REPORTS),
  (req, res, next) => financeController.stats(req, res, next),
);

// Invoices
router.get(
  '/invoices',
  authorize(PERMISSION_CODES.VIEW_FINANCE),
  validateQuery(listInvoicesQuerySchema),
  (req, res, next) => financeController.listInvoices(req, res, next),
);

router.get(
  '/invoices/:id',
  authorize(PERMISSION_CODES.VIEW_FINANCE),
  validateParams(idParamSchema),
  (req, res, next) => financeController.getInvoiceById(req, res, next),
);

router.post(
  '/invoices',
  authorize(PERMISSION_CODES.CREATE_INVOICE),
  validateBody(createInvoiceSchema),
  (req, res, next) => financeController.createInvoice(req, res, next),
);

router.post(
  '/invoices/:id/cancel',
  authorize(PERMISSION_CODES.EDIT_INVOICE),
  validateParams(idParamSchema),
  (req, res, next) => financeController.cancelInvoice(req, res, next),
);

// Payments
router.get(
  '/payments',
  authorize(PERMISSION_CODES.VIEW_FINANCE),
  validateQuery(listPaymentsQuerySchema),
  (req, res, next) => financeController.listPayments(req, res, next),
);

router.get(
  '/payments/:id',
  authorize(PERMISSION_CODES.VIEW_FINANCE),
  validateParams(idParamSchema),
  (req, res, next) => financeController.getPaymentById(req, res, next),
);

router.post(
  '/payments',
  authorize(PERMISSION_CODES.CREATE_PAYMENT),
  validateBody(createPaymentSchema),
  (req, res, next) => financeController.createPayment(req, res, next),
);

router.post(
  '/payments/:id/void',
  authorize(PERMISSION_CODES.VOID_PAYMENT),
  validateParams(idParamSchema),
  validateBody(voidPaymentSchema),
  (req, res, next) => financeController.voidPayment(req, res, next),
);

export { router as financeRoutes };