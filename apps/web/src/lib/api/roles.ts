import { api } from '@/lib/api/client';

export interface RoleDetail {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  permissions: string[];
  permissionDetails: Array<{ code: string; category: string; description: string }>;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  code: string;
  displayName: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  displayName?: string;
  description?: string;
  permissions?: string[];
}

export const rolesApi = {
  list: (): Promise<RoleDetail[]> => api.get<RoleDetail[]>('/roles'),

  getById: (id: string): Promise<RoleDetail> => api.get<RoleDetail>(`/roles/${id}`),

  create: (input: CreateRoleInput): Promise<RoleDetail> =>
    api.post<RoleDetail>('/roles', input),

  update: (id: string, input: UpdateRoleInput): Promise<RoleDetail> =>
    api.patch<RoleDetail>(`/roles/${id}`, input),

  delete: (id: string): Promise<void> => api.delete<void>(`/roles/${id}`),
};