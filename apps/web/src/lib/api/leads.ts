import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'COUNSELING_BOOKED' | 'COUNSELING_ATTENDED'
  | 'NO_SHOW' | 'FOLLOW_UP' | 'INTERESTED' | 'QUALIFIED'
  | 'CONVERTED' | 'NOT_INTERESTED' | 'LOST';

export type LeadSource =
  | 'WEBSITE' | 'FACEBOOK' | 'INSTAGRAM' | 'MESSENGER'
  | 'WALK_IN' | 'REFERRAL' | 'PHONE' | 'GOOGLE_FORM' | 'OTHER';

export interface Lead {
  id: string;
  leadNumber: string;
  branch: { id: string; code: string; name: string };
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string;
    occupation?: string;
  };
  address?: {
    permanentAddress?: string;
    presentAddress?: string;
  };
  education?: {
    lastEducation?: '10+2' | 'BACHELOR' | 'MASTER' | 'OTHER';
    faculty?: string;
    japaneseLanguageHistory?: boolean;
    japanesePassedYear?: string;
    japaneseInstitute?: string;
  };
  preference?: {
    preferredCollege?: string;
    periodOfStudy?: string;
    preferredIntake?: 'APRIL' | 'JULY' | 'OCTOBER' | 'JANUARY';
    previousVisaApply?: boolean;
  };
  family?: {
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
  };
  source: LeadSource;
  sourceMetadata?: Record<string, string | undefined>;
  interestedProgram?: { id: string; code: string; name: string } | null;
  interestedVisaCategory?: { id: string; code: string; name: string } | null;
  preferredCounseling?: { date?: string; time?: string };
  assignedCounselor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  status: LeadStatus;
  notes?: string;
  convertedToStudent?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  } | null;
  convertedAt?: string;
  createdBy: { id: string; email: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
}

export interface ListLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  branchId?: string;
  assignedCounselorId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateLeadInput {
  branchId: string;
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string;
    occupation?: string;
  };
  address?: {
    permanentAddress?: string;
    presentAddress?: string;
  };
  education?: {
    lastEducation?: '10+2' | 'BACHELOR' | 'MASTER' | 'OTHER';
    faculty?: string;
    japaneseLanguageHistory?: boolean;
    japanesePassedYear?: string;
    japaneseInstitute?: string;
  };
  preference?: {
    preferredCollege?: string;
    periodOfStudy?: string;
    preferredIntake?: 'APRIL' | 'JULY' | 'OCTOBER' | 'JANUARY';
    previousVisaApply?: boolean;
  };
  family?: {
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
  };
  source: LeadSource;
  sourceMetadata?: {
    referredBy?: string;
  };
  interestedProgramId?: string;
  interestedVisaCategoryId?: string;
  notes?: string;
}

export interface UpdateLeadInput {
  personal?: Partial<CreateLeadInput['personal']>;
  address?: Partial<NonNullable<CreateLeadInput['address']>>;
  education?: Partial<NonNullable<CreateLeadInput['education']>>;
  preference?: Partial<NonNullable<CreateLeadInput['preference']>>;
  family?: Partial<NonNullable<CreateLeadInput['family']>>;
  interestedProgramId?: string;
  interestedVisaCategoryId?: string;
  notes?: string;
}

export interface UpdateLeadStatusInput {
  status: LeadStatus;
  reason?: string;
}

export interface AssignLeadInput {
  counselorId: string;
}

export const leadsApi = {
  list: async (params: ListLeadsParams = {}): Promise<{ items: Lead[]; pagination: PaginationMeta }> => {
    const items = await api.get<Lead[]>('/leads', params as Record<string, unknown>);
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

  stats: (): Promise<LeadStats> => api.get<LeadStats>('/leads/stats'),
  getById: (id: string): Promise<Lead> => api.get<Lead>(`/leads/${id}`),
  create: (input: CreateLeadInput): Promise<Lead> => api.post<Lead>('/leads', input),
  update: (id: string, input: UpdateLeadInput): Promise<Lead> => api.patch<Lead>(`/leads/${id}`, input),
  updateStatus: (id: string, input: UpdateLeadStatusInput): Promise<Lead> => api.post<Lead>(`/leads/${id}/status`, input),
  assign: (id: string, input: AssignLeadInput): Promise<Lead> => api.post<Lead>(`/leads/${id}/assign`, input),
  delete: (id: string): Promise<void> => api.delete<void>(`/leads/${id}`),
};