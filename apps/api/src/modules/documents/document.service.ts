import { Types } from 'mongoose';
import {
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_TRANSITIONS,
  ORGANIZATION_WIDE_ROLE_CODES,
  ROLE_CODES,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  type DocumentStatus,
  type RoleCode,
} from '@consultancy/config';
import { documentRepository } from './document.repository.js';
import { r2Service } from './r2.service.js';
import { studentRepository } from '../students/student.repository.js';
import type { DocumentEntity, DocumentVersionDocument } from './document.model.js';
import type { StudentDocument } from '../students/student.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import type { UserDocument } from '../users/user.model.js';
import {
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
  ValidationError,
} from '../../lib/errors.js';
import { generateDocumentNumber } from '../../lib/studentId.js';
import type {
  UploadDocumentMetadataDto,
  RejectDocumentDto,
  RequestResubmissionDto,
  ListDocumentsQueryDto,
} from './document.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedDocument {
  id: string;
  documentNumber: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  application?: {
    id: string;
    applicationNumber: string;
    status: string;
  } | null;
  branch: { id: string; code: string; name: string };
  documentType: string;
  documentName: string;
  description?: string;
  currentVersion: {
    id: string;
    versionNumber: number;
    file: {
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    };
    uploadedAt: Date;
  };
  versionCount: number;
  status: DocumentStatus;
  uploadedBy: { id: string; email: string; firstName: string; lastName: string };
  uploadedAt: Date;
  reviewedBy?: { id: string; firstName: string; lastName: string } | null;
  reviewedAt?: Date;
  verifiedBy?: { id: string; firstName: string; lastName: string } | null;
  verifiedAt?: Date;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  approvedAt?: Date;
  rejectedBy?: { id: string; firstName: string; lastName: string } | null;
  rejectedAt?: Date;
  rejectionReason?: string;
  resubmissionRequestedAt?: Date;
  resubmissionReason?: string;
  expiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class DocumentService {
  async listDocuments(
    query: ListDocumentsQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedDocument[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await documentRepository.list(
      {
        branchId: branchFilter,
        studentId: query.studentId,
        applicationId: query.applicationId,
        documentType: query.documentType,
        status: query.status as DocumentStatus | undefined,
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((d) => this.format(d)), pagination };
  }

  async getDocumentById(id: string, actor: ActorContext): Promise<FormattedDocument> {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document', id);
    this.enforceAccess(doc, actor);
    return this.format(doc);
  }

  async listOwnDocuments(userId: string): Promise<FormattedDocument[]> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new NotFoundError('Student profile');
    const docs = await documentRepository.findByStudent(String(student._id));
    return docs.map((d) => this.format(d));
  }

  async uploadDocument(
    metadata: UploadDocumentMetadataDto,
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
      size: number;
    },
    actor: ActorContext,
  ): Promise<FormattedDocument> {
    // Validate file
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds maximum allowed (${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024}MB)`,
      );
    }

    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimeType as never)) {
      throw new ValidationError(
        `File type ${file.mimeType} is not allowed. Allowed: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
      );
    }

    // Load student
    const student = await studentRepository.findById(metadata.studentId);
    if (!student) throw new NotFoundError('Student', metadata.studentId);

    // Enforce branch access
    const studentBranchId = String((student.branch as unknown as BranchDocument)._id);
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    if (!isOrgWide && studentBranchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this student's branch");
    }

    // Upload to R2
    const uploadResult = await r2Service.uploadBuffer(
      file.buffer,
      file.originalName,
      file.mimeType,
      student.studentId,
      metadata.documentType,
    );

    const documentNumber = await generateDocumentNumber();

    const created = await documentRepository.createDocumentWithVersion(
      {
        documentNumber,
        student: student._id as Types.ObjectId,
        application: metadata.applicationId
          ? new Types.ObjectId(metadata.applicationId)
          : undefined,
        branch: (student.branch as unknown as BranchDocument)._id as Types.ObjectId,
        documentType: metadata.documentType,
        documentName: metadata.documentName,
        description: metadata.description,
        uploadedBy: new Types.ObjectId(actor.id),
        expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate) : undefined,
        notes: metadata.notes,
      },
      {
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
      },
    );

    return this.format(created);
  }

  async uploadNewVersion(
    documentId: string,
    file: { buffer: Buffer; originalName: string; mimeType: string; size: number },
    actor: ActorContext,
  ): Promise<FormattedDocument> {
    const existing = await documentRepository.findById(documentId);
    if (!existing) throw new NotFoundError('Document', documentId);
    this.enforceAccess(existing, actor);

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds maximum allowed (${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024}MB)`,
      );
    }
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimeType as never)) {
      throw new ValidationError(`File type ${file.mimeType} is not allowed`);
    }

    const student = existing.student as unknown as StudentDocument;
    const uploadResult = await r2Service.uploadBuffer(
      file.buffer,
      file.originalName,
      file.mimeType,
      student.studentId,
      existing.documentType,
    );

    const updated = await documentRepository.addNewVersion(documentId, {
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
    });

    if (!updated) throw new NotFoundError('Document', documentId);
    return this.format(updated);
  }

  async getDownloadUrl(id: string, actor: ActorContext): Promise<{ url: string }> {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document', id);
    this.enforceAccess(doc, actor);

    const version = doc.currentVersion as unknown as DocumentVersionDocument;
    const url = await r2Service.getSignedDownloadUrl(version.storage.key);
    return { url };
  }

  async markUnderReview(id: string, actor: ActorContext): Promise<FormattedDocument> {
    return this.transitionStatus(id, DOCUMENT_STATUSES.UNDER_REVIEW, actor, {
      reviewedBy: new Types.ObjectId(actor.id),
      reviewedAt: new Date(),
    });
  }

  async verifyDocument(id: string, actor: ActorContext): Promise<FormattedDocument> {
    // Branch Manager verifies
    return this.transitionStatus(id, DOCUMENT_STATUSES.VERIFIED, actor, {
      verifiedBy: new Types.ObjectId(actor.id),
      verifiedAt: new Date(),
    });
  }

  async approveDocument(id: string, actor: ActorContext): Promise<FormattedDocument> {
    // Only Admin/Super Admin can final-approve
    if (actor.role !== ROLE_CODES.ADMIN && actor.role !== ROLE_CODES.SUPER_ADMIN) {
      throw new ForbiddenError('Only Admin or Super Admin can approve documents');
    }
    return this.transitionStatus(id, DOCUMENT_STATUSES.APPROVED, actor, {
      approvedBy: new Types.ObjectId(actor.id),
      approvedAt: new Date(),
    });
  }

  async rejectDocument(
    id: string,
    data: RejectDocumentDto,
    actor: ActorContext,
  ): Promise<FormattedDocument> {
    return this.transitionStatus(id, DOCUMENT_STATUSES.REJECTED, actor, {
      rejectedBy: new Types.ObjectId(actor.id),
      rejectedAt: new Date(),
      rejectionReason: data.reason,
    });
  }

  async requestResubmission(
    id: string,
    data: RequestResubmissionDto,
    actor: ActorContext,
  ): Promise<FormattedDocument> {
    return this.transitionStatus(
      id,
      DOCUMENT_STATUSES.RESUBMISSION_REQUIRED,
      actor,
      {
        resubmissionRequestedBy: new Types.ObjectId(actor.id),
        resubmissionRequestedAt: new Date(),
        resubmissionReason: data.reason,
      },
    );
  }

  async getVersions(id: string, actor: ActorContext) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document', id);
    this.enforceAccess(doc, actor);

    const versions = await documentRepository.getVersions(id);
    return versions.map((v) => {
      const uploader = v.uploadedBy as unknown as UserDocument;
      return {
        id: String(v._id),
        versionNumber: v.versionNumber,
        file: v.file,
        isCurrent: v.isCurrent,
        uploadedBy: uploader?.email
          ? {
              email: uploader.email,
              name: `${uploader.profile.firstName} ${uploader.profile.lastName}`,
            }
          : null,
        uploadedAt: v.uploadedAt,
      };
    });
  }

  async getStats(actor: ActorContext) {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchId = isOrgWide ? undefined : actor.branch ?? undefined;
    const counts = await documentRepository.countByStatus(branchId);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { total, byStatus: counts };
  }

  private async transitionStatus(
    id: string,
    newStatus: DocumentStatus,
    actor: ActorContext,
    additional: Partial<DocumentEntity>,
  ): Promise<FormattedDocument> {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document', id);
    this.enforceAccess(doc, actor);

    const currentStatus = doc.status;
    const allowed = DOCUMENT_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStateTransitionError('Document', currentStatus, newStatus);
    }

    const updated = await documentRepository.updateStatus(id, newStatus, additional);
    if (!updated) throw new NotFoundError('Document', id);
    return this.format(updated);
  }

  private enforceAccess(doc: DocumentEntity, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branchId = String((doc.branch as unknown as BranchDocument)._id);
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this document's branch");
    }
  }

  private format(d: DocumentEntity): FormattedDocument {
    const student = d.student as unknown as StudentDocument;
    const branch = d.branch as unknown as BranchDocument;
    const application = d.application as unknown as
      | { _id: Types.ObjectId; applicationNumber: string; status: string }
      | undefined;
    const currentVersion = d.currentVersion as unknown as DocumentVersionDocument;
    const uploader = d.uploadedBy as unknown as UserDocument;

    const formatUserRef = (u: unknown) => {
      if (!u) return null;
      const user = u as UserDocument;
      return {
        id: String(user._id),
        firstName: user.profile?.firstName ?? '',
        lastName: user.profile?.lastName ?? '',
      };
    };

    return {
      id: String(d._id),
      documentNumber: d.documentNumber,
      student: {
        id: String(student._id),
        studentId: student.studentId,
        firstName: student.personal.firstName,
        lastName: student.personal.lastName,
      },
      application: application
        ? {
            id: String(application._id),
            applicationNumber: application.applicationNumber,
            status: application.status,
          }
        : null,
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      documentType: d.documentType,
      documentName: d.documentName,
      description: d.description,
      currentVersion: {
        id: String(currentVersion._id),
        versionNumber: currentVersion.versionNumber,
        file: {
          originalName: currentVersion.file.originalName,
          mimeType: currentVersion.file.mimeType,
          sizeBytes: currentVersion.file.sizeBytes,
        },
        uploadedAt: currentVersion.uploadedAt,
      },
      versionCount: d.versionCount,
      status: d.status,
      uploadedBy: {
        id: String(uploader._id),
        email: uploader.email,
        firstName: uploader.profile.firstName,
        lastName: uploader.profile.lastName,
      },
      uploadedAt: d.uploadedAt,
      reviewedBy: formatUserRef(d.reviewedBy),
      reviewedAt: d.reviewedAt,
      verifiedBy: formatUserRef(d.verifiedBy),
      verifiedAt: d.verifiedAt,
      approvedBy: formatUserRef(d.approvedBy),
      approvedAt: d.approvedAt,
      rejectedBy: formatUserRef(d.rejectedBy),
      rejectedAt: d.rejectedAt,
      rejectionReason: d.rejectionReason,
      resubmissionRequestedAt: d.resubmissionRequestedAt,
      resubmissionReason: d.resubmissionReason,
      expiryDate: d.expiryDate,
      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}

export const documentService = new DocumentService();