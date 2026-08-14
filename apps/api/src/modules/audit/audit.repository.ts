import { Types, type FilterQuery } from 'mongoose';
import { AuditLogModel, type AuditLogDocument } from './audit.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';

export interface CreateAuditData {
  actor: Types.ObjectId;
  actorRole: string;
  branch?: Types.ObjectId;
  action: string;
  category: string;
  entity: {
    type: string;
    id: Types.ObjectId | string;
    displayName?: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata: {
    requestId: string;
    ipAddress?: string;
    userAgent?: string;
    additionalContext?: Record<string, unknown>;
  };
}

export interface ListAuditFilter {
  actorId?: string;
  branchId?: string;
  action?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListAuditResult {
  items: AuditLogDocument[];
  pagination: PaginationMeta;
}

export class AuditRepository {
  async create(data: CreateAuditData): Promise<AuditLogDocument> {
    const entry = await AuditLogModel.create(data);
    return entry.toObject() as AuditLogDocument;
  }

  async findById(id: string): Promise<AuditLogDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return AuditLogModel.findById(id)
      .populate('actor', 'email profile.firstName profile.lastName')
      .populate('branch', 'code name')
      .lean<AuditLogDocument | null>();
  }

  async list(
    filter: ListAuditFilter,
    page: number,
    limit: number,
  ): Promise<ListAuditResult> {
    const query: FilterQuery<AuditLogDocument> = {};

    if (filter.actorId && Types.ObjectId.isValid(filter.actorId)) {
      query.actor = new Types.ObjectId(filter.actorId);
    }
    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.action) {
      query.action = filter.action;
    }
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.entityType) {
      query['entity.type'] = filter.entityType;
    }
    if (filter.entityId) {
      query['entity.id'] = Types.ObjectId.isValid(filter.entityId)
        ? new Types.ObjectId(filter.entityId)
        : filter.entityId;
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) query.createdAt.$gte = filter.startDate;
      if (filter.endDate) query.createdAt.$lte = filter.endDate;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AuditLogModel.find(query)
        .populate('actor', 'email profile.firstName profile.lastName')
        .populate('branch', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<AuditLogDocument[]>(),
      AuditLogModel.countDocuments(query),
    ]);

    return {
      items,
      pagination: createPaginationMeta(page, limit, total),
    };
  }
}

export const auditRepository = new AuditRepository();