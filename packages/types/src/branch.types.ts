import type { Address, EntityId } from './common.types.js';

export interface Branch {
  id: EntityId;
  code: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  timezone: string;
  manager?: EntityId;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  code: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  timezone?: string;
  managerId?: EntityId;
}

export interface UpdateBranchInput {
  name?: string;
  address?: Partial<Address>;
  phone?: string;
  email?: string;
  managerId?: EntityId;
  isActive?: boolean;
}