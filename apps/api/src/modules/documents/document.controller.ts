import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { documentService } from './document.service.js';
import { sendSuccess, sendCreated } from '../../lib/response.js';
import { auditService } from '../audit/audit.service.js';
import { extractAuditContext } from '../../middleware/auditLogger.js';
import { UnauthorizedError, ValidationError } from '../../lib/errors.js';

function actorFromReq(req: Request) {
  if (!req.currentUser) throw new UnauthorizedError();
  return {
    id: req.currentUser.id,
    role: req.currentUser.role.code as RoleCode,
    branch: req.currentUser.branch?.id ?? null,
  };
}

/**
 * Local file interface matching what multer.memoryStorage() produces.
 * We use this instead of Express.Multer.File to avoid global type dependencies.
 */
interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string;
  encoding?: string;
}

/**
 * Extract uploaded file from request (attached by multer middleware).
 */
function getUploadedFile(req: Request): UploadedFile {
  const file = (req as unknown as { file?: UploadedFile }).file;
  if (!file) throw new ValidationError('File is required');
  if (!file.buffer || !file.originalname || !file.mimetype) {
    throw new ValidationError('Invalid file upload');
  }
  return file;
}

export class DocumentController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentService.listDocuments(
        req.query as never,
        actorFromReq(req),
      );
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await documentService.getStats(actorFromReq(req)));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await documentService.getDocumentById(req.params.id!, actorFromReq(req)),
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.currentUser) throw new UnauthorizedError();
      const docs = await documentService.listOwnDocuments(req.currentUser.id);
      sendSuccess(res, docs);
    } catch (error) {
      next(error);
    }
  }

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = getUploadedFile(req);

      const metadata = {
        studentId: req.body.studentId,
        applicationId: req.body.applicationId,
        documentType: req.body.documentType,
        documentName: req.body.documentName,
        description: req.body.description,
        expiryDate: req.body.expiryDate,
        notes: req.body.notes,
      };

      const doc = await documentService.uploadDocument(
        metadata as never,
        {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        actorFromReq(req),
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_UPLOADED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
        changes: {
          after: {
            student: doc.student.studentId,
            documentType: doc.documentType,
            fileName: doc.currentVersion.file.originalName,
          },
        },
      });

      sendCreated(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async uploadNewVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = getUploadedFile(req);

      const doc = await documentService.uploadNewVersion(
        req.params.id!,
        {
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        actorFromReq(req),
      );

      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_VERSION_UPLOADED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
        changes: { after: { versionNumber: doc.currentVersion.versionNumber } },
      });

      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await documentService.getDownloadUrl(req.params.id!, actorFromReq(req));

      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_DOWNLOADED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: req.params.id! },
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.markUnderReview(req.params.id!, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_REVIEWED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
      });
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.verifyDocument(req.params.id!, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_VERIFIED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
      });
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.approveDocument(req.params.id!, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_APPROVED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
      });
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.rejectDocument(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_REJECTED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
        additionalContext: { reason: req.body.reason },
      });
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async requestResubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.requestResubmission(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'DOCUMENT_RESUBMISSION_REQUESTED',
        category: 'DOCUMENT',
        entity: { type: 'DOCUMENT', id: doc.id, displayName: doc.documentNumber },
        additionalContext: { reason: req.body.reason },
      });
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = await documentService.getVersions(req.params.id!, actorFromReq(req));
      sendSuccess(res, versions);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();