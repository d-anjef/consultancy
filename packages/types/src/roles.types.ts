import type { EntityId } from './common.types.js';

type RoleCode = string;
type PermissionCode = string;

export interface Role {
  id: EntityId;
  code: RoleCode | string;
  displayName: string;
  description?: string;
  permissions: PermissionCode[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: EntityId;
  code: PermissionCode;
  category: string;
  description: string;
}