import { Types, type FilterQuery } from 'mongoose';
import {
  DocumentModel,
  DocumentVersionModel,
  type DocumentEntity,
  type DocumentVersionDocument,
} from './document.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import type { DocumentStatus } from '@consultancy/config';

const DOCUMENT_POPULATE = [
  {
    path: 'student',
    select: 'studentId personal.firstName personal.lastName',
  },
  { path: 'application', select: 'applicationNumber status' },
  { path: 'branch', select: 'code name' },
  { path: 'currentVersion' },
  {
    path: 'uploadedBy',
    select: 'email profile.firstName profile.lastName',
  },
  {
    path: 'reviewedBy',
    select: 'email profile.firstName profile.lastName',
  },
  {
    path: 'verifiedBy',
    select: 'email profile.firstName profile.lastName',
  },
  {
    path: 'approvedBy',
    select: 'email profile.firstName profile.lastName',
  },
  {
    path: 'rejectedBy',
    select: 'email profile.firstName profile.lastName',
  },
];

export interface CreateDocumentData {
  documentNumber: string;
  student: Types.ObjectId;
  application?: Types.ObjectId;
  branch: Types.ObjectId;
  documentType: string;
  documentName: string;
  description?: string;
  uploadedBy: Types.ObjectId;
  expiryDate?: Date;
  notes?: string;
}

export interface CreateVersionData {
  document: Types.ObjectId;
  versionNumber: number;
  storage: DocumentVersionDocument['storage'];
  file: DocumentVersionDocument['file'];
  uploadedBy: Types.ObjectId;
}

export interface ListDocumentsFilter {
  branchId?: string;
  studentId?: string;
  applicationId?: string;
  documentType?: string;
  status?: DocumentStatus;
  search?: string;
}

export class DocumentRepository {
  async findById(id: string): Promise<DocumentEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return DocumentModel.findById(id)
      .populate(DOCUMENT_POPULATE)
      .lean<DocumentEntity | null>();
  }

  async findByStudent(studentId: string): Promise<DocumentEntity[]> {
    if (!Types.ObjectId.isValid(studentId)) return [];
    return DocumentModel.find({ student: new Types.ObjectId(studentId) })
      .populate(DOCUMENT_POPULATE)
      .sort({ uploadedAt: -1 })
      .lean<DocumentEntity[]>();
  }

  async createDocumentWithVersion(
    docData: CreateDocumentData,
    versionData: Omit<CreateVersionData, 'document' | 'versionNumber'>,
  ): Promise<DocumentEntity> {
    const doc = await DocumentModel.create({
      ...docData,
      currentVersion: new Types.ObjectId(),
      versionCount: 1,
    });

    const version = await DocumentVersionModel.create({
      document: doc._id,
      versionNumber: 1,
      ...versionData,
      isCurrent: true,
    });

    await DocumentModel.findByIdAndUpdate(doc._id, {
      $set: { currentVersion: version._id },
    });

    const populated = await DocumentModel.findById(doc._id)
      .populate(DOCUMENT_POPULATE)
      .lean<DocumentEntity | null>();

    if (!populated) throw new Error('Failed to load created document');
    return populated;
  }

  async addNewVersion(
    documentId: string,
    versionData: Omit<CreateVersionData, 'document' | 'versionNumber'>,
  ): Promise<DocumentEntity | null> {
    if (!Types.ObjectId.isValid(documentId)) return null;

    const existing = await DocumentModel.findById(documentId).lean<DocumentEntity | null>();
    if (!existing) return null;

    // Mark old versions as not current
    await DocumentVersionModel.updateMany(
      { document: new Types.ObjectId(documentId), isCurrent: true },
      { $set: { isCurrent: false } },
    );

    // Create new version
    const newVersionNumber = existing.versionCount + 1;
    const newVersion = await DocumentVersionModel.create({
      document: new Types.ObjectId(documentId),
      versionNumber: newVersionNumber,
      ...versionData,
      isCurrent: true,
    });

    // Update document: reset status to SUBMITTED, bump version count
    await DocumentModel.findByIdAndUpdate(documentId, {
      $set: {
        currentVersion: newVersion._id,
        versionCount: newVersionNumber,
        status: 'SUBMITTED',
        uploadedBy: versionData.uploadedBy,
        uploadedAt: new Date(),
      },
      $unset: {
        reviewedBy: '',
        reviewedAt: '',
        verifiedBy: '',
        verifiedAt: '',
        approvedBy: '',
        approvedAt: '',
        rejectedBy: '',
        rejectedAt: '',
        rejectionReason: '',
        resubmissionRequestedBy: '',
        resubmissionRequestedAt: '',
        resubmissionReason: '',
      },
    });

    return DocumentModel.findById(documentId)
      .populate(DOCUMENT_POPULATE)
      .lean<DocumentEntity | null>();
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    additionalFields: Partial<DocumentEntity>,
  ): Promise<DocumentEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return DocumentModel.findByIdAndUpdate(
      id,
      { $set: { status, ...additionalFields } },
      { new: true },
    )
      .populate(DOCUMENT_POPULATE)
      .lean<DocumentEntity | null>();
  }

  async getVersions(documentId: string): Promise<DocumentVersionDocument[]> {
    if (!Types.ObjectId.isValid(documentId)) return [];
    return DocumentVersionModel.find({ document: new Types.ObjectId(documentId) })
      .populate('uploadedBy', 'email profile.firstName profile.lastName')
      .sort({ versionNumber: -1 })
      .lean<DocumentVersionDocument[]>();
  }

  async getVersionById(versionId: string): Promise<DocumentVersionDocument | null> {
    if (!Types.ObjectId.isValid(versionId)) return null;
    return DocumentVersionModel.findById(versionId).lean<DocumentVersionDocument | null>();
  }

  async list(
    filter: ListDocumentsFilter,
    page: number,
    limit: number,
  ): Promise<{ items: DocumentEntity[]; pagination: PaginationMeta }> {
    const query: FilterQuery<DocumentEntity> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.studentId && Types.ObjectId.isValid(filter.studentId)) {
      query.student = new Types.ObjectId(filter.studentId);
    }
    if (filter.applicationId && Types.ObjectId.isValid(filter.applicationId)) {
      query.application = new Types.ObjectId(filter.applicationId);
    }
    if (filter.documentType) query.documentType = filter.documentType.toUpperCase();
    if (filter.status) query.status = filter.status;
    if (filter.search) {
      const s = filter.search.trim();
      query.$or = [
        { documentNumber: { $regex: s, $options: 'i' } },
        { documentName: { $regex: s, $options: 'i' } },
        { documentType: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      DocumentModel.find(query)
        .populate(DOCUMENT_POPULATE)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<DocumentEntity[]>(),
      DocumentModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }

  async countByStatus(branchId?: string): Promise<Record<string, number>> {
    const matchStage: Record<string, unknown> = {};
    if (branchId && Types.ObjectId.isValid(branchId)) {
      matchStage.branch = new Types.ObjectId(branchId);
    }
    const results = await DocumentModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const r of results) counts[r._id] = r.count;
    return counts;
  }
}

export const documentRepository = new DocumentRepository();