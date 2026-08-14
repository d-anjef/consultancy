import type { Request, Response, NextFunction } from 'express';
import type { RoleCode } from '@consultancy/config';
import { learningMaterialService } from './learning-material.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response.js';
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

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

function getUploadedFile(req: Request): UploadedFile {
  const file = (req as unknown as { file?: UploadedFile }).file;
  if (!file) throw new ValidationError('File is required');
  if (!file.buffer || !file.originalname || !file.mimetype) {
    throw new ValidationError('Invalid file upload');
  }
  return file;
}

export class LearningMaterialController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await learningMaterialService.list(req.query as never);
      sendSuccess(res, result.items, 200, { pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await learningMaterialService.getById(req.params.id!));
    } catch (error) {
      next(error);
    }
  }

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = getUploadedFile(req);

      const metadata = {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        languageLevelId: req.body.languageLevelId,
        tags: req.body.tags
          ? typeof req.body.tags === 'string'
            ? req.body.tags.split(',').map((t: string) => t.trim())
            : req.body.tags
          : [],
        isPublic: req.body.isPublic !== 'false',
      };

      const material = await learningMaterialService.uploadMaterial(
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
        action: 'LEARNING_MATERIAL_UPLOADED',
        category: 'SYSTEM',
        entity: { type: 'MATERIAL', id: material.id, displayName: material.title },
      });

      sendCreated(res, material);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await learningMaterialService.updateMaterial(
        req.params.id!,
        req.body,
        actorFromReq(req),
      );
      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEARNING_MATERIAL_UPDATED',
        category: 'SYSTEM',
        entity: { type: 'MATERIAL', id: material.id, displayName: material.title },
      });
      sendSuccess(res, material);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await learningMaterialService.getById(req.params.id!);
      await learningMaterialService.deleteMaterial(req.params.id!, actorFromReq(req));
      await auditService.log({
        ...extractAuditContext(req),
        action: 'LEARNING_MATERIAL_DELETED',
        category: 'SYSTEM',
        entity: { type: 'MATERIAL', id: material.id, displayName: material.title },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await learningMaterialService.getDownloadUrl(req.params.id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const learningMaterialController = new LearningMaterialController();