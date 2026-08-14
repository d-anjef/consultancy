import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VISITING';

export interface Teacher {
  id: string;
  employeeId: string;
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    profilePhotoUrl?: string;
    status: string;
  };
  branch: { id: string; code: string; name: string };
  qualification?: string;
  specialization: string[];
  experienceYears?: number;
  employmentType: EmploymentType;
  joinedDate: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListTeachersParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  isActive?: boolean;
}

export const teachersApi = {
  list: async (params: ListTeachersParams = {}) => {
    const items = await api.get<Teacher[]>('/teachers', params as Record<string, unknown>);
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
  getById: (id: string): Promise<Teacher> => api.get<Teacher>(`/teachers/${id}`),
  getMe: (): Promise<Teacher> => api.get<Teacher>('/teachers/me'),
};