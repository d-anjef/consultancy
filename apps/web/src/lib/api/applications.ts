import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type ApplicationStatus =
  | 'DRAFT'
  | 'REGISTERED'
  | 'DOCUMENT_COLLECTION'
  | 'DOCUMENT_REVIEW'
  | 'DOCUMENT_VERIFICATION'
  | 'FINAL_APPROVAL'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'ADDITIONAL_DOCUMENT_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Application {
  id: string;
  applicationNumber: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  branch: { id: string; code: string; name: string };
  visaCategory: { id: string; code: string; name: string };
  program: { id: string; code: string; name: string; type: string };
  schoolOrCompany: {
    name: string;
    country: string;
    address?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  intake: {
    year: number;
    month?: number;
    session?: 'SPRING' | 'FALL' | 'WINTER' | 'SUMMER';
  };
  assignedCounselor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  status: ApplicationStatus;
  deadlines?: {
    documentSubmission?: string;
    applicationSubmission?: string;
    result?: string;
  };
  notes?: string;
  isActive: boolean;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  fromStatus?: string;
  toStatus: string;
  changedBy: {
    id: string;
    email?: string;
    name?: string;
  };
  changedAt: string;
  reason?: string;
}

export interface ListApplicationsParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  branchId?: string;
  studentId?: string;
  visaCategoryId?: string;
  programId?: string;
  assignedCounselorId?: string;
  intakeYear?: number;
  isActive?: boolean;
}

export interface CreateApplicationInput {
  studentId: string;
  visaCategoryId: string;
  programId: string;
  schoolOrCompany: {
    name: string;
    country?: string;
    address?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  intake: {
    year: number;
    month?: number;
    session?: 'SPRING' | 'FALL' | 'WINTER' | 'SUMMER';
  };
  assignedCounselorId: string;
  notes?: string;
}

export interface UpdateApplicationInput {
  schoolOrCompany?: Partial<CreateApplicationInput['schoolOrCompany']>;
  intake?: Partial<CreateApplicationInput['intake']>;
  deadlines?: {
    documentSubmission?: string;
    applicationSubmission?: string;
    result?: string;
  };
  assignedCounselorId?: string;
  notes?: string;
}

export interface ChangeApplicationStatusInput {
  status: ApplicationStatus;
  reason?: string;
}

export interface CancelApplicationInput {
  reason: string;
}

export const applicationsApi = {
  list: async (
    params: ListApplicationsParams = {},
  ): Promise<{ items: Application[]; pagination: PaginationMeta }> => {
    const items = await api.get<Application[]>('/applications', params as Record<string, unknown>);
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  

  getById: (id: string): Promise<Application> => api.get<Application>(`/applications/${id}`),

  getHistory: (id: string): Promise<ApplicationStatusHistoryEntry[]> =>
    api.get<ApplicationStatusHistoryEntry[]>(`/applications/${id}/history`),

  create: (input: CreateApplicationInput): Promise<Application> =>
    api.post<Application>('/applications', input),

  update: (id: string, input: UpdateApplicationInput): Promise<Application> =>
    api.patch<Application>(`/applications/${id}`, input),

  changeStatus: (id: string, input: ChangeApplicationStatusInput): Promise<Application> =>
    api.post<Application>(`/applications/${id}/status`, input),

  cancel: (id: string, input: CancelApplicationInput): Promise<Application> =>
    api.post<Application>(`/applications/${id}/cancel`, input),
};