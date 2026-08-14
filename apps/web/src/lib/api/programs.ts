import { api } from '@/lib/api/client';

export type ProgramType =
  | 'LANGUAGE_SCHOOL'
  | 'UNIVERSITY'
  | 'VOCATIONAL'
  | 'WORKING'
  | 'OTHER';

export interface Program {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: ProgramType;
  durationMonths?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramInput {
  code: string;
  name: string;
  description?: string;
  type: ProgramType;
  durationMonths?: number;
}

export interface UpdateProgramInput {
  name?: string;
  description?: string;
  type?: ProgramType;
  durationMonths?: number;
  isActive?: boolean;
}

export const programsApi = {
  list: (): Promise<Program[]> => api.get<Program[]>('/programs'),
  getById: (id: string): Promise<Program> => api.get<Program>(`/programs/${id}`),
  create: (input: CreateProgramInput): Promise<Program> =>
    api.post<Program>('/programs', input),
  update: (id: string, input: UpdateProgramInput): Promise<Program> =>
    api.patch<Program>(`/programs/${id}`, input),
};