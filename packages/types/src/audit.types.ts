import type { EntityId } from './common.types.js';

export interface AuditLogEntry {
  id: EntityId;
  actor: {
    id: EntityId;
    email: string;
    role: string;
  };
  branch?: {
    id: EntityId;
    name: string;
  };
  action: string;
  category: string;
  entity: {
    type: string;
    id: EntityId;
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
  createdAt: string;
}

export interface AuditLogQuery {
  actorId?: EntityId;
  branchId?: EntityId;
  action?: string;
  category?: string;
  entityType?: string;
  entityId?: EntityId;
  startDate?: string;
  endDate?: string;
}