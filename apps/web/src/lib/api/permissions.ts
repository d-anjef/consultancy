import { api } from '@/lib/api/client';

export interface Permission {
  _id: string;
  code: string;
  category: string;
  description: string;
}

export const permissionsApi = {
  list: (): Promise<Permission[]> => api.get<Permission[]>('/permissions'),

  listGrouped: (): Promise<Record<string, Permission[]>> =>
    api.get<Record<string, Permission[]>>('/permissions/grouped'),
};