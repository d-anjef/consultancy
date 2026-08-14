import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface AuditEntityRef {
  type: string;
  id: Types.ObjectId | string;
  displayName?: string;
}

export interface AuditChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditMetadata {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  additionalContext?: Record<string, unknown>;
}

export interface AuditLogDocument extends Document {
  actor: Types.ObjectId;
  actorRole: string;
  branch?: Types.ObjectId;
  action: string;
  category: string;
  entity: AuditEntityRef;
  changes?: AuditChanges;
  metadata: AuditMetadata;
  createdAt: Date;
}

const auditEntityRefSchema = new Schema<AuditEntityRef>(
  {
    type: { type: String, required: true, index: true },
    id: { type: Schema.Types.Mixed, required: true, index: true },
    displayName: { type: String },
  },
  { _id: false },
);

const auditChangesSchema = new Schema<AuditChanges>(
  {
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const auditMetadataSchema = new Schema<AuditMetadata>(
  {
    requestId: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    additionalContext: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: auditEntityRefSchema,
      required: true,
    },
    changes: {
      type: auditChangesSchema,
    },
    metadata: {
      type: auditMetadataSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  },
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ branch: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ 'entity.type': 1, 'entity.id': 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<AuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);