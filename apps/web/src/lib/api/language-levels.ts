import { api } from '@/lib/api/client';

export type ExamType = 'JLPT' | 'NAT' | 'CUSTOM';

export interface LanguageLevel {
  id: string;
  code: string;
  name: string;
  description?: string;
  examType: ExamType;
  order: number;
  durationMonths?: number;
  prerequisite?: { id: string; code: string; name: string } | null;
  fee?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLanguageLevelInput {
  code: string;
  name: string;
  description?: string;
  examType: ExamType;
  order?: number;
  durationMonths?: number;
  prerequisiteId?: string;
  fee?: number;
}

export interface UpdateLanguageLevelInput {
  name?: string;
  description?: string;
  examType?: ExamType;
  order?: number;
  durationMonths?: number;
  prerequisiteId?: string | null;
  fee?: number;
  isActive?: boolean;
}

export const languageLevelsApi = {
  list: (includeInactive = false): Promise<LanguageLevel[]> =>
    api.get<LanguageLevel[]>('/language-levels', { includeInactive }),

  getById: (id: string): Promise<LanguageLevel> =>
    api.get<LanguageLevel>(`/language-levels/${id}`),

  create: (input: CreateLanguageLevelInput): Promise<LanguageLevel> =>
    api.post<LanguageLevel>('/language-levels', input),

  update: (id: string, input: UpdateLanguageLevelInput): Promise<LanguageLevel> =>
    api.patch<LanguageLevel>(`/language-levels/${id}`, input),

  delete: (id: string): Promise<void> => api.delete<void>(`/language-levels/${id}`),
};