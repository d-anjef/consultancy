import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES, MAX_DOCUMENT_SIZE_BYTES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  rejectDocumentSchema,
  requestResubmissionSchema,
  listDocumentsQuerySchema,
} from './document.validators.js';
import { documentController } from './document.controller.js';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
});

// Student own documents
router.get(
  '/me',
  authorize(PERMISSION_CODES.VIEW_OWN_DOCUMENT_STATUS),
  (req, res, next) => documentController.getMyDocuments(req, res, next),
);

// Staff
router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_DOCUMENT),
  validateQuery(listDocumentsQuerySchema),
  (req, res, next) => documentController.list(req, res, next),
);

router.get(
  '/stats',
  authorize(PERMISSION_CODES.VIEW_DOCUMENT),
  (req, res, next) => documentController.stats(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_DOCUMENT),
  validateParams(idParamSchema),
  (req, res, next) => documentController.getById(req, res, next),
);

router.get(
  '/:id/versions',
  authorize(PERMISSION_CODES.VIEW_DOCUMENT),
  validateParams(idParamSchema),
  (req, res, next) => documentController.getVersions(req, res, next),
);

router.get(
  '/:id/download',
  authorize(PERMISSION_CODES.VIEW_DOCUMENT),
  validateParams(idParamSchema),
  (req, res, next) => documentController.download(req, res, next),
);

router.post(
  '/upload',
  authorize(PERMISSION_CODES.UPLOAD_DOCUMENT),
  upload.single('file'),
  (req, res, next) => documentController.upload(req, res, next),
);

router.post(
  '/:id/version',
  authorize(PERMISSION_CODES.UPLOAD_DOCUMENT),
  validateParams(idParamSchema),
  upload.single('file'),
  (req, res, next) => documentController.uploadNewVersion(req, res, next),
);

router.post(
  '/:id/review',
  authorize(PERMISSION_CODES.REVIEW_DOCUMENT),
  validateParams(idParamSchema),
  (req, res, next) => documentController.review(req, res, next),
);

router.post(
  '/:id/verify',
  authorize(PERMISSION_CODES.VERIFY_DOCUMENT),
  validateParams(idParamSchema),
  (req, res, next) => documentController.verify(req, res, next),
);

router.post(
  '/:id/approve',
  authorize(PERMISSION_CODES.FINAL_APPROVE_DOCUMENT),
  validateParams(idParamSchema),
  (req, res, next) => documentController.approve(req, res, next),
);

router.post(
  '/:id/reject',
  authorize(PERMISSION_CODES.REJECT_DOCUMENT),
  validateParams(idParamSchema),
  validateBody(rejectDocumentSchema),
  (req, res, next) => documentController.reject(req, res, next),
);

router.post(
  '/:id/request-resubmission',
  authorize(PERMISSION_CODES.REQUEST_RESUBMISSION),
  validateParams(idParamSchema),
  validateBody(requestResubmissionSchema),
  (req, res, next) => documentController.requestResubmission(req, res, next),
);

export { router as documentRoutes };