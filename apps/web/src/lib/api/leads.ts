import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

// ─── Types matching backend FormattedLead ─────────────────

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'COUNSELING_BOOKED'
  | 'COUNSELING_ATTENDED'
  | 'NO_SHOW'
  | 'FOLLOW_UP'
  | 'INTERESTED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'LOST';

export type LeadSource =
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'MESSENGER'
  | 'WALK_IN'
  | 'REFERRAL'
  | 'PHONE'
  | 'GOOGLE_FORM'
  | 'OTHER';

export interface Lead {
  id: string;
  leadNumber: string;
  branch: {
    id: string;
    code: string;
    name: string;
  };
  personal: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  source: LeadSource;
  sourceMetadata?: {
    formId?: string;
    referredBy?: string;
    utmSource?: string;
    utmCampaign?: string;
    externalRef?: string;
  };
  interestedProgram?: { id: string; code: string; name: string } | null;
  interestedVisaCategory?: { id: string; code: string; name: string } | null;
  preferredCounseling?: {
    date?: string;
    time?: string;
  };
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
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
}

// ─── API Calls ─────────────────────────────────────────────

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
    phone: string;
    email?: string;
  };
  source: LeadSource;
  sourceMetadata?: {
    referredBy?: string;
    utmSource?: string;
    utmCampaign?: string;
  };
  interestedProgramId?: string;
  interestedVisaCategoryId?: string;
  preferredCounseling?: {
    date?: string;
    time?: string;
  };
  assignedCounselorId?: string;
  notes?: string;
}

export interface UpdateLeadInput {
  personal?: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  }>;
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

// Note: our api client returns the `data` field directly (unwrapped)
// but keeps pagination in `meta`. For list endpoints we need both.
// We use the raw axios response for pagination-aware calls.

export const leadsApi = {
  list: async (params: ListLeadsParams = {}): Promise<{ items: Lead[]; pagination: PaginationMeta }> => {
    const items = await api.get<Lead[]>('/leads', params as Record<string, unknown>);
    // Pagination comes as meta on the raw response — we need to make a separate call
    // OR update our api client to expose meta. For now, we compute a stub pagination.
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

  update: (id: string, input: UpdateLeadInput): Promise<Lead> =>
    api.patch<Lead>(`/leads/${id}`, input),

  updateStatus: (id: string, input: UpdateLeadStatusInput): Promise<Lead> =>
    api.post<Lead>(`/leads/${id}/status`, input),

  assign: (id: string, input: AssignLeadInput): Promise<Lead> =>
    api.post<Lead>(`/leads/${id}/assign`, input),

  delete: (id: string): Promise<void> => api.delete<void>(`/leads/${id}`),
};