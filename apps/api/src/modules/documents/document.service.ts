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
import { userRepository } from '../users/user.repository.js';
import { notificationService } from '../notifications/notification.service.js';
import { emailService } from '../auth/email.service.js';
import { logger } from '../../lib/logger.js';
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

    const student = await studentRepository.findById(metadata.studentId);
    if (!student) throw new NotFoundError('Student', metadata.studentId);

    const studentBranch = student.branch as unknown as BranchDocument | null;
    const studentBranchId = studentBranch?._id ? String(studentBranch._id) : null;
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    if (!isOrgWide && studentBranchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this student's branch");
    }

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
        branch: studentBranch!._id as Types.ObjectId,
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

    // ═══ NOTIFY STAFF (assigned counselor if any) ═══
    this.notifyDocumentNeedsVerification(created, student).catch((err) =>
      logger.warn({ err, docId: created._id }, 'Document upload notification failed (non-blocking)'),
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
    const result = await this.transitionStatus(id, DOCUMENT_STATUSES.VERIFIED, actor, {
      verifiedBy: new Types.ObjectId(actor.id),
      verifiedAt: new Date(),
    });

    // In-app notification only (no email — too noisy for positive)
    this.notifyDocumentVerified(id).catch((err) =>
      logger.warn({ err, docId: id }, 'Document verified notification failed'),
    );

    return result;
  }

  async approveDocument(id: string, actor: ActorContext): Promise<FormattedDocument> {
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
    const result = await this.transitionStatus(id, DOCUMENT_STATUSES.REJECTED, actor, {
      rejectedBy: new Types.ObjectId(actor.id),
      rejectedAt: new Date(),
      rejectionReason: data.reason,
    });

    // Notify + email student
    this.notifyDocumentRejected(id, data.reason).catch((err) =>
      logger.warn({ err, docId: id }, 'Document rejected notification failed'),
    );

    return result;
  }

  async requestResubmission(
    id: string,
    data: RequestResubmissionDto,
    actor: ActorContext,
  ): Promise<FormattedDocument> {
    const result = await this.transitionStatus(
      id,
      DOCUMENT_STATUSES.RESUBMISSION_REQUIRED,
      actor,
      {
        resubmissionRequestedBy: new Types.ObjectId(actor.id),
        resubmissionRequestedAt: new Date(),
        resubmissionReason: data.reason,
      },
    );

    // Notify + email student (re-use rejected template)
    this.notifyDocumentRejected(id, data.reason).catch((err) =>
      logger.warn({ err, docId: id }, 'Document resubmission notification failed'),
    );

    return result;
  }

  async getVersions(id: string, actor: ActorContext) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document', id);
    this.enforceAccess(doc, actor);

    const versions = await documentRepository.getVersions(id);
    return versions.map((v) => {
      const uploader = v.uploadedBy as unknown as UserDocument | null;
      return {
        id: String(v._id),
        versionNumber: v.versionNumber,
        file: v.file,
        isCurrent: v.isCurrent,
        uploadedBy: uploader?.email
          ? {
              email: uploader.email,
              name: `${uploader.profile?.firstName ?? ''} ${uploader.profile?.lastName ?? ''}`.trim(),
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
    const branch = doc.branch as unknown as BranchDocument | null;
    const branchId = branch?._id ? String(branch._id) : null;
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this document's branch");
    }
  }

  // ═══════════════════════════════════════════════════
  // NOTIFICATION HELPERS
  // ═══════════════════════════════════════════════════

  private async notifyDocumentNeedsVerification(
    doc: DocumentEntity,
    student: StudentDocument,
  ): Promise<void> {
    // Notify the student's assigned counselor (if any)
    const counselorId = student.assignedCounselor as unknown as Types.ObjectId | undefined;
    if (!counselorId) return;

    const counselor = await userRepository.findById(String(counselorId));
    if (!counselor?.email) return;

    const studentName = `${student.personal?.firstName ?? ''} ${student.personal?.lastName ?? ''}`.trim();
    const branch = doc.branch as unknown as BranchDocument | null;

    await Promise.all([
      notificationService.create({
        recipientId: String(counselorId),
        recipientRole: 'COUNSELOR',
        branchId: branch?._id ? String(branch._id) : undefined,
        event: 'DOCUMENT_NEEDS_VERIFICATION',
        category: 'DOCUMENTS',
        title: 'Document Uploaded',
        message: `${studentName} uploaded ${doc.documentName} — verification needed`,
        metadata: {
          entityType: 'Document',
          entityId: String(doc._id),
          deepLink: `/documents`,
        },
        priority: 'NORMAL',
      }),
      emailService.sendDocumentNeedsVerification({
        to: counselor.email,
        recipientName: `${counselor.profile?.firstName ?? 'Counselor'}`,
        studentName: studentName || 'Student',
        documentName: doc.documentName,
        documentNumber: doc.documentNumber,
      }),
    ]);
  }

  private async notifyDocumentVerified(docId: string): Promise<void> {
    const doc = await documentRepository.findById(docId);
    if (!doc) return;

    const student = doc.student as unknown as StudentDocument | null;
    if (!student?.userId) return;

    const branch = doc.branch as unknown as BranchDocument | null;

    await notificationService.create({
      recipientId: String(student.userId),
      recipientRole: 'STUDENT',
      branchId: branch?._id ? String(branch._id) : undefined,
      event: 'DOCUMENT_VERIFIED',
      category: 'DOCUMENTS',
      title: 'Document Verified',
      message: `Your document "${doc.documentName}" has been verified ✓`,
      metadata: {
        entityType: 'Document',
        entityId: String(doc._id),
        deepLink: '/my/documents',
      },
      priority: 'NORMAL',
    });
  }

  private async notifyDocumentRejected(docId: string, reason: string): Promise<void> {
    const doc = await documentRepository.findById(docId);
    if (!doc) return;

    const student = doc.student as unknown as StudentDocument | null;
    if (!student?.userId) return;

    const studentUser = await userRepository.findById(String(student.userId));
    if (!studentUser?.email) return;

    const studentName = `${student.personal?.firstName ?? ''} ${student.personal?.lastName ?? ''}`.trim();
    const branch = doc.branch as unknown as BranchDocument | null;

    await Promise.all([
      notificationService.create({
        recipientId: String(student.userId),
        recipientRole: 'STUDENT',
        branchId: branch?._id ? String(branch._id) : undefined,
        event: 'DOCUMENT_REJECTED',
        category: 'DOCUMENTS',
        title: 'Document Re-submission Required',
        message: `Your document "${doc.documentName}" needs re-submission. Reason: ${reason}`,
        metadata: {
          entityType: 'Document',
          entityId: String(doc._id),
          deepLink: '/my/documents',
        },
        priority: 'HIGH',
      }),
      emailService.sendDocumentRejected({
        to: studentUser.email,
        recipientName: studentName || 'Student',
        documentName: doc.documentName,
        reason,
      }),
    ]);
  }

  // ═══════════════════════════════════════════════════
  // FORMAT FUNCTION (null-safe)
  // ═══════════════════════════════════════════════════

  private format(d: DocumentEntity): FormattedDocument {
    const student = d.student as unknown as StudentDocument | null;
    const branch = d.branch as unknown as BranchDocument | null;
    const application = d.application as unknown as
      | { _id: Types.ObjectId; applicationNumber: string; status: string }
      | null
      | undefined;
    const currentVersion = d.currentVersion as unknown as DocumentVersionDocument | null;
    const uploader = d.uploadedBy as unknown as UserDocument | null;

    const formatUserRef = (u: unknown) => {
      if (!u) return null;
      const user = u as UserDocument;
      if (!user._id) return null;
      return {
        id: String(user._id),
        firstName: user.profile?.firstName ?? '',
        lastName: user.profile?.lastName ?? '',
      };
    };

    return {
      id: String(d._id),
      documentNumber: d.documentNumber,
      student: student?._id
        ? {
            id: String(student._id),
            studentId: student.studentId ?? '',
            firstName: student.personal?.firstName ?? '',
            lastName: student.personal?.lastName ?? '',
          }
        : {
            id: '',
            studentId: 'DELETED',
            firstName: 'Deleted',
            lastName: 'Student',
          },
      application: application?._id
        ? {
            id: String(application._id),
            applicationNumber: application.applicationNumber,
            status: application.status,
          }
        : null,
      branch: branch?._id
        ? { id: String(branch._id), code: branch.code, name: branch.name }
        : { id: '', code: 'N/A', name: 'Unknown Branch' },
      documentType: d.documentType,
      documentName: d.documentName,
      description: d.description,
      currentVersion: currentVersion?._id
        ? {
            id: String(currentVersion._id),
            versionNumber: currentVersion.versionNumber,
            file: {
              originalName: currentVersion.file.originalName,
              mimeType: currentVersion.file.mimeType,
              sizeBytes: currentVersion.file.sizeBytes,
            },
            uploadedAt: currentVersion.uploadedAt,
          }
        : {
            id: '',
            versionNumber: 0,
            file: { originalName: 'missing', mimeType: 'unknown', sizeBytes: 0 },
            uploadedAt: new Date(),
          },
      versionCount: d.versionCount,
      status: d.status,
      uploadedBy: uploader?._id
        ? {
            id: String(uploader._id),
            email: uploader.email,
            firstName: uploader.profile?.firstName ?? '',
            lastName: uploader.profile?.lastName ?? '',
          }
        : {
            id: '',
            email: 'deleted@user',
            firstName: 'Deleted',
            lastName: 'User',
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