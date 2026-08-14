import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type ClassStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

export interface ClassEntity {
  id: string;
  classCode: string;
  name: string;
  branch: { id: string; code: string; name: string };
  program?: { id: string; code: string; name: string; type: string } | null;
  languageLevel?: { id: string; code: string; name: string; examType: string } | null;
  teacher: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  students: Array<{ id: string; studentId: string; firstName: string; lastName: string }>;
  studentsCount: number;
  schedule: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    roomOrLocation?: string;
  };
  startDate: string;
  endDate?: string;
  status: ClassStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  name: string;
  branchId: string;
  programId?: string;
  languageLevelId?: string;
  teacherId: string;
  schedule: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    roomOrLocation?: string;
  };
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface ListClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClassStatus;
  branchId?: string;
  teacherId?: string;
  studentId?: string;
  languageLevelId?: string;
}

export const classesApi = {
  list: async (params: ListClassesParams = {}) => {
    const items = await api.get<ClassEntity[]>('/classes', params as Record<string, unknown>);
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
  getById: (id: string): Promise<ClassEntity> => api.get<ClassEntity>(`/classes/${id}`),
  getMyClasses: (): Promise<ClassEntity[]> => api.get<ClassEntity[]>('/classes/me'),
  create: (input: CreateClassInput): Promise<ClassEntity> =>
    api.post<ClassEntity>('/classes', input),
  enroll: (id: string, studentIds: string[]): Promise<ClassEntity> =>
    api.post<ClassEntity>(`/classes/${id}/enroll`, { studentIds }),
  unenroll: (id: string, studentIds: string[]): Promise<ClassEntity> =>
    api.post<ClassEntity>(`/classes/${id}/unenroll`, { studentIds }),
};