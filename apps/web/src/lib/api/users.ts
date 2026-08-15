import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';

export interface UserEntity {
  id: string;
  email: string;
  role: { id: string; code: string; displayName: string };
  branch: { id: string; code: string; name: string } | null;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    profilePhotoUrl?: string;
  };
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  roleCode: string;
  branchId?: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  sendInvitation?: boolean;
}

export interface UpdateUserInput {
  profile?: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
  }>;
  branchId?: string | null;
  status?: UserStatus;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  roleCode?: string;
  branchId?: string;
  status?: UserStatus;
}

export const usersApi = {
  list: async (params: ListUsersParams = {}) => {
    const items = await api.get<UserEntity[]>('/users', params as Record<string, unknown>);
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      } as PaginationMeta,
    };
  },
  getById: (id: string) => api.get<UserEntity>(`/users/${id}`),
  create: (input: CreateUserInput) => api.post<UserEntity>('/users', input),
  update: (id: string, input: UpdateUserInput) =>
    api.patch<UserEntity>(`/users/${id}`, input),
  deactivate: (id: string) => api.post<UserEntity>(`/users/${id}/deactivate`),
  activate: (id: string) => api.post<UserEntity>(`/users/${id}/activate`),
  resendInvitation: (id: string) => api.post(`/users/${id}/resend-invitation`),
};