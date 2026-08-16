import { Types } from 'mongoose';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  type RoleCode,
} from '@consultancy/config';
import { learningMaterialRepository } from './learning-material.repository.js';
import { r2Service } from '../documents/r2.service.js';
import type {
  LearningMaterialDocument,
  MaterialCategory,
} from './learning-material.model.js';
import type { UserDocument } from '../users/user.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../lib/errors.js';
import type {
  UploadMaterialMetadataDto,
  UpdateMaterialDto,
  ListMaterialsQueryDto,
} from './learning-material.validators.js';
import type { PaginationMeta } from '@consultancy/types';

const MAX_MATERIAL_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface FormattedMaterial {
  id: string;
  title: string;
  description?: string;
  category: MaterialCategory;
  languageLevel?: { id: string; code: string; name: string; examType: string } | null;
  tags: string[];
  file: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  uploadedBy: { id: string; firstName: string; lastName: string; email: string };
  branch: { id: string; code: string; name: string };
  isPublic: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class LearningMaterialService {
  async list(
    query: ListMaterialsQueryDto,
  ): Promise<{ items: FormattedMaterial[]; pagination: PaginationMeta }> {
    const { items, pagination } = await learningMaterialRepository.list(
      {
        category: query.category as MaterialCategory | undefined,
        languageLevelId: query.languageLevelId,
        search: query.search,
        tags: query.tags,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((m) => this.format(m)), pagination };
  }

  async getById(id: string): Promise<FormattedMaterial> {
    const material = await learningMaterialRepository.findById(id);
    if (!material) throw new NotFoundError('Material', id);
    return this.format(material);
  }

  async uploadMaterial(
    metadata: UploadMaterialMetadataDto,
    file: { buffer: Buffer; originalName: string; mimeType: string; size: number },
    actor: ActorContext,
  ): Promise<FormattedMaterial> {
    if (file.size > MAX_MATERIAL_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds ${MAX_MATERIAL_SIZE_BYTES / 1024 / 1024}MB limit`,
      );
    }

    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimeType as never)) {
      throw new ValidationError(`File type ${file.mimeType} not allowed`);
    }

    if (!actor.branch) {
      throw new ForbiddenError('You must be assigned to a branch');
    }

    // Upload to R2 in materials/ prefix
    const uploadResult = await r2Service.uploadBuffer(
      file.buffer,
      file.originalName,
      file.mimeType,
      'materials',
      metadata.category,
    );

    const created = await learningMaterialRepository.create({
      title: metadata.title,
      description: metadata.description,
      category: metadata.category as MaterialCategory,
      languageLevel: metadata.languageLevelId
        ? new Types.ObjectId(metadata.languageLevelId)
        : undefined,
      tags: metadata.tags,
      storage: {
        provider: 'R2',
        bucket: uploadResult.bucket,
        key: uploadResult.key,
      },
      file: {
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.size,
        checksum: uploadResult.checksum,
      },
      uploadedBy: new Types.ObjectId(actor.id),
      branch: new Types.ObjectId(actor.branch),
      isPublic: metadata.isPublic,
    });

    return this.format(created);
  }

  async updateMaterial(
    id: string,
    data: UpdateMaterialDto,
    actor: ActorContext,
  ): Promise<FormattedMaterial> {
    const existing = await learningMaterialRepository.findById(id);
    if (!existing) throw new NotFoundError('Material', id);

    // Only uploader or admin can update
    const uploader = existing.uploadedBy as unknown as UserDocument;
    if (
      String(uploader._id) !== actor.id &&
      actor.role !== 'SUPER_ADMIN' &&
      actor.role !== 'ADMIN'
    ) {
      throw new ForbiddenError('You can only edit your own materials');
    }

    const updated = await learningMaterialRepository.update(id, {
      title: data.title,
      description: data.description,
      category: data.category as MaterialCategory | undefined,
      languageLevel:
        data.languageLevelId === null
          ? null
          : data.languageLevelId
          ? new Types.ObjectId(data.languageLevelId)
          : undefined,
      tags: data.tags,
      isPublic: data.isPublic,
    });

    if (!updated) throw new NotFoundError('Material', id);
    return this.format(updated);
  }

  async deleteMaterial(id: string, actor: ActorContext): Promise<void> {
    const existing = await learningMaterialRepository.findById(id);
    if (!existing) throw new NotFoundError('Material', id);

    const uploader = existing.uploadedBy as unknown as UserDocument;
    if (
      String(uploader._id) !== actor.id &&
      actor.role !== 'SUPER_ADMIN' &&
      actor.role !== 'ADMIN'
    ) {
      throw new ForbiddenError('You can only delete your own materials');
    }

    // Delete file from R2
    try {
      await r2Service.deleteObject(existing.storage.key);
    } catch {
      // Continue even if R2 delete fails — we still remove from DB
    }

    await learningMaterialRepository.delete(id);
  }

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const material = await learningMaterialRepository.findById(id);
    if (!material) throw new NotFoundError('Material', id);

    const url = await r2Service.getSignedDownloadUrl(material.storage.key);

    // Increment download count (fire and forget)
    learningMaterialRepository.incrementDownload(id).catch(() => {});

    return { url };
  }

  private format(m: LearningMaterialDocument): FormattedMaterial {
  const level = m.languageLevel as unknown as
    | { _id: Types.ObjectId; code: string; name: string; examType: string }
    | null
    | undefined;
  const uploader = m.uploadedBy as unknown as UserDocument | null;
  const branch = m.branch as unknown as BranchDocument | null;

  return {
    id: String(m._id),
    title: m.title,
    description: m.description,
    category: m.category,
    languageLevel: level?._id
      ? {
          id: String(level._id),
          code: level.code,
          name: level.name,
          examType: level.examType,
        }
      : null,
    tags: m.tags ?? [],
    file: {
      originalName: m.file.originalName,
      mimeType: m.file.mimeType,
      sizeBytes: m.file.sizeBytes,
    },
    uploadedBy: uploader?._id
      ? {
          id: String(uploader._id),
          firstName: uploader.profile?.firstName ?? '',
          lastName: uploader.profile?.lastName ?? '',
          email: uploader.email,
        }
      : {
          id: '',
          firstName: 'Deleted',
          lastName: 'User',
          email: 'deleted@user',
        },
    branch: branch?._id
      ? { id: String(branch._id), code: branch.code, name: branch.name }
      : { id: '', code: 'N/A', name: 'Unknown Branch' },
    isPublic: m.isPublic,
    downloadCount: m.downloadCount,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}
}

export const learningMaterialService = new LearningMaterialService();