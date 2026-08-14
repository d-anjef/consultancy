import { Types } from 'mongoose';
import { auditRepository, type ListAuditFilter } from './audit.repository.js';
import type { AuditLogDocument } from './audit.model.js';
import { logger } from '../../lib/logger.js';
import type { PaginationMeta } from '@consultancy/types';

export interface AuditLogInput {
  actor: string;
  actorRole: string;
  branch?: string | null;
  action: string;
  category: string;
  entity: {
    type: string;
    id: string;
    displayName?: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  additionalContext?: Record<string, unknown>;
}

export interface FormattedAuditLog {
  id: string;
  actor: {
    id: string;
    email?: string;
    name?: string;
  };
  actorRole: string;
  branch?: {
    id: string;
    code?: string;
    name?: string;
  };
  action: string;
  category: string;
  entity: {
    type: string;
    id: string;
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
  createdAt: Date;
}

export interface ListAuditResponse {
  items: FormattedAuditLog[];
  pagination: PaginationMeta;
}

export class AuditService {
  async log(input: AuditLogInput): Promise<void> {
    try {
      const actorId = Types.ObjectId.isValid(input.actor)
        ? new Types.ObjectId(input.actor)
        : null;

      if (!actorId) {
        logger.warn({ input }, 'Skipping audit log — invalid actor ID');
        return;
      }

      const branchId =
        input.branch && Types.ObjectId.isValid(input.branch)
          ? new Types.ObjectId(input.branch)
          : undefined;

      const entityId = Types.ObjectId.isValid(input.entity.id)
        ? new Types.ObjectId(input.entity.id)
        : input.entity.id;

      await auditRepository.create({
        actor: actorId,
        actorRole: input.actorRole,
        branch: branchId,
        action: input.action,
        category: input.category,
        entity: {
          type: input.entity.type,
          id: entityId,
          displayName: input.entity.displayName,
        },
        changes: input.changes,
        metadata: {
          requestId: input.requestId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          additionalContext: input.additionalContext,
        },
      });
    } catch (error) {
      logger.error({ error, input }, 'Failed to write audit log');
    }
  }

  async listAuditLogs(
    filter: ListAuditFilter,
    page: number,
    limit: number,
  ): Promise<ListAuditResponse> {
    const { items, pagination } = await auditRepository.list(filter, page, limit);
    return {
      items: items.map((item) => this.formatAuditLog(item)),
      pagination,
    };
  }

  async getAuditLogById(id: string): Promise<FormattedAuditLog | null> {
    const log = await auditRepository.findById(id);
    return log ? this.formatAuditLog(log) : null;
  }

  private formatAuditLog(log: AuditLogDocument): FormattedAuditLog {
    const actor = log.actor as unknown as {
      _id: Types.ObjectId;
      email?: string;
      profile?: { firstName?: string; lastName?: string };
    };
    const branch = log.branch as unknown as
      | { _id: Types.ObjectId; code?: string; name?: string }
      | undefined;

    return {
      id: String(log._id),
      actor: {
        id: String(actor?._id ?? log.actor),
        email: actor?.email,
        name:
          actor?.profile?.firstName && actor?.profile?.lastName
            ? `${actor.profile.firstName} ${actor.profile.lastName}`
            : undefined,
      },
      actorRole: log.actorRole,
      branch: branch
        ? {
            id: String(branch._id),
            code: branch.code,
            name: branch.name,
          }
        : undefined,
      action: log.action,
      category: log.category,
      entity: {
        type: log.entity.type,
        id: String(log.entity.id),
        displayName: log.entity.displayName,
      },
      changes: log.changes,
      metadata: log.metadata,
      createdAt: log.createdAt,
    };
  }
}

export const auditService = new AuditService();