import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import { DOCUMENT_STATUSES, type DocumentStatus } from '@consultancy/config';

export interface DocumentStorage {
  provider: 'R2' | 'CLOUDINARY';
  bucket: string;
  key: string;
  url?: string;
}

export interface DocumentFile {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

// ─── Document Version ───────────────────────────────────

export interface DocumentVersionDocument extends Document {
  document: Types.ObjectId;
  versionNumber: number;
  storage: DocumentStorage;
  file: DocumentFile;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  isCurrent: boolean;
}

const documentStorageSchema = new Schema<DocumentStorage>(
  {
    provider: { type: String, required: true, enum: ['R2', 'CLOUDINARY'] },
    bucket: { type: String, required: true },
    key: { type: String, required: true },
    url: { type: String },
  },
  { _id: false },
);

const documentFileSchema = new Schema<DocumentFile>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    checksum: { type: String, required: true },
  },
  { _id: false },
);

const documentVersionSchema = new Schema<DocumentVersionDocument>(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true, min: 1 },
    storage: { type: documentStorageSchema, required: true },
    file: { type: documentFileSchema, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    isCurrent: { type: Boolean, default: true },
  },
  { collection: 'document_versions' },
);

documentVersionSchema.index({ document: 1, versionNumber: -1 });
documentVersionSchema.index({ document: 1, isCurrent: 1 });

export const DocumentVersionModel: Model<DocumentVersionDocument> =
  mongoose.models.DocumentVersion ||
  mongoose.model<DocumentVersionDocument>('DocumentVersion', documentVersionSchema);

// ─── Document ───────────────────────────────────

export interface DocumentEntity extends Document {
  documentNumber: string;
  student: Types.ObjectId;
  application?: Types.ObjectId;
  branch: Types.ObjectId;

  documentType: string;
  documentName: string;
  description?: string;

  currentVersion: Types.ObjectId;
  versionCount: number;

  status: DocumentStatus;

  uploadedBy: Types.ObjectId;
  uploadedAt: Date;

  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;

  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;

  approvedBy?: Types.ObjectId;
  approvedAt?: Date;

  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;

  resubmissionRequestedBy?: Types.ObjectId;
  resubmissionRequestedAt?: Date;
  resubmissionReason?: string;

  expiryDate?: Date;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<DocumentEntity>(
  {
    documentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    documentName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    currentVersion: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentVersion',
      required: true,
    },
    versionCount: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      required: true,
      enum: Object.values(DOCUMENT_STATUSES),
      default: DOCUMENT_STATUSES.SUBMITTED,
      index: true,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    resubmissionRequestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resubmissionRequestedAt: { type: Date },
    resubmissionReason: { type: String, trim: true },
    expiryDate: { type: Date, index: true, sparse: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'documents' },
);

documentSchema.index({ student: 1, status: 1 });
documentSchema.index({ branch: 1, status: 1 });
documentSchema.index({ application: 1, status: 1 });

export const DocumentModel: Model<DocumentEntity> =
  mongoose.models.Document || mongoose.model<DocumentEntity>('Document', documentSchema);