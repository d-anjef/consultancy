import { Router } from 'express';
import { z } from 'zod';
import { authorize } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { PERMISSION_CODES } from '@consultancy/config';
import { objectIdSchema } from '@consultancy/validators';
import {
  createStudentSchema,
  updateStudentSchema,
  updateOwnStudentProfileSchema,
  transferStudentBranchSchema,
  listStudentsQuerySchema,
} from './student.validators.js';
import { studentController } from './student.controller.js';
import multer from 'multer';

const router: Router = Router();
const idParamSchema = z.object({ id: objectIdSchema });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  },
});

// Student self routes
router.get(
  '/me',
  authorize(PERMISSION_CODES.VIEW_OWN_STUDENT_PROFILE),
  (req, res, next) => studentController.getMe(req, res, next),
);

router.patch(
  '/me',
  authorize(PERMISSION_CODES.EDIT_OWN_STUDENT_PROFILE),
  validateBody(updateOwnStudentProfileSchema),
  (req, res, next) => studentController.updateMe(req, res, next),
);

// Staff routes
router.get(
  '/',
  authorize(PERMISSION_CODES.VIEW_STUDENT),
  validateQuery(listStudentsQuerySchema),
  (req, res, next) => studentController.list(req, res, next),
);

router.get(
  '/stats',
  authorize(PERMISSION_CODES.VIEW_STUDENT),
  (req, res, next) => studentController.stats(req, res, next),
);

router.get(
  '/:id',
  authorize(PERMISSION_CODES.VIEW_STUDENT),
  validateParams(idParamSchema),
  (req, res, next) => studentController.getById(req, res, next),
);

router.post(
  '/',
  authorize(PERMISSION_CODES.CREATE_STUDENT),
  validateBody(createStudentSchema),
  (req, res, next) => studentController.create(req, res, next),
);

router.patch(
  '/:id',
  authorize(PERMISSION_CODES.EDIT_STUDENT),
  validateParams(idParamSchema),
  validateBody(updateStudentSchema),
  (req, res, next) => studentController.update(req, res, next),
);

router.post(
  '/:id/archive',
  authorize(PERMISSION_CODES.ARCHIVE_STUDENT),
  validateParams(idParamSchema),
  (req, res, next) => studentController.archive(req, res, next),
);

router.post(
  '/:id/transfer',
  authorize(PERMISSION_CODES.TRANSFER_STUDENT_BRANCH),
  validateParams(idParamSchema),
  validateBody(transferStudentBranchSchema),
  (req, res, next) => studentController.transfer(req, res, next),
);
// ─── Bulk Import ────────────────────────────────────────────────────
router.get(
  '/import/template',
  authorize(PERMISSION_CODES.CREATE_STUDENT),
  (req, res, next) => studentController.downloadTemplate(req, res, next),
);

router.post(
  '/import/bulk',
  authorize(PERMISSION_CODES.CREATE_STUDENT),
  upload.single('file'),
  (req, res, next) => studentController.bulkImport(req, res, next),
);

router.post(
  '/import/error-report',
  authorize(PERMISSION_CODES.CREATE_STUDENT),
  (req, res, next) => studentController.downloadErrorReport(req, res, next),
);

export { router as studentRoutes };