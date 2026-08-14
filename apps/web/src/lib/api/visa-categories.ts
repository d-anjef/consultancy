import { api } from '@/lib/api/client';

export interface VisaCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  requiredDocumentTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisaCategoryInput {
  code: string;
  name: string;
  description?: string;
  requiredDocumentTypes?: string[];
}

export interface UpdateVisaCategoryInput {
  name?: string;
  description?: string;
  requiredDocumentTypes?: string[];
  isActive?: boolean;
}

export const visaCategoriesApi = {
  list: (): Promise<VisaCategory[]> => api.get<VisaCategory[]>('/visa-categories'),
  getById: (id: string): Promise<VisaCategory> =>
    api.get<VisaCategory>(`/visa-categories/${id}`),
  create: (input: CreateVisaCategoryInput): Promise<VisaCategory> =>
    api.post<VisaCategory>('/visa-categories', input),
  update: (id: string, input: UpdateVisaCategoryInput): Promise<VisaCategory> =>
    api.patch<VisaCategory>(`/visa-categories/${id}`, input),
};