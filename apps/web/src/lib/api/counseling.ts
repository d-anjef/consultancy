import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

// ─── Types ──────────────────────────────────────────────────

export type CounselingStatus =
  | 'BOOKED'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'RESCHEDULED'
  | 'CANCELLED';

export type CounselingResult = 'QUALIFIED' | 'NOT_QUALIFIED' | 'NEEDS_FOLLOWUP';

export interface Counseling {
  id: string;
  counselingNumber: string;
  lead: {
    id: string;
    leadNumber: string;
    firstName: string;
    lastName: string;
    status: string;
  };
  branch: { id: string; code: string; name: string };
  counselor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: CounselingStatus;
  attendedAt?: string;
  outcome?: {
    result?: CounselingResult;
    notes?: string;
    nextSteps?: string;
  };
  followUpDate?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Request Payloads ───────────────────────────────────────

export interface ListCounselingParams {
  page?: number;
  limit?: number;
  status?: CounselingStatus;
  branchId?: string;
  counselorId?: string;
  leadId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateCounselingInput {
  leadId: string;
  counselorId: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes?: number;
}

export interface UpdateCounselingInput {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  counselorId?: string;
}

export interface RescheduleCounselingInput {
  scheduledDate: string;
  scheduledTime: string;
  reason?: string;
}

export interface CancelCounselingInput {
  reason?: string;
}

export interface AttendCounselingInput {
  attendedAt?: string;
  outcome?: {
    result?: CounselingResult;
    notes?: string;
    nextSteps?: string;
    recommendedProgramId?: string;
    recommendedVisaCategoryId?: string;
  };
  followUpDate?: string;
}

export interface NoShowCounselingInput {
  notes?: string;
}

// ─── API Calls ──────────────────────────────────────────────

export const counselingApi = {
  list: async (
    params: ListCounselingParams = {},
  ): Promise<{ items: Counseling[]; pagination: PaginationMeta }> => {
    const items = await api.get<Counseling[]>(
      '/counseling',
      params as Record<string, unknown>,
    );
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

  getById: (id: string): Promise<Counseling> =>
    api.get<Counseling>(`/counseling/${id}`),

  create: (input: CreateCounselingInput): Promise<Counseling> =>
    api.post<Counseling>('/counseling', input),

  update: (id: string, input: UpdateCounselingInput): Promise<Counseling> =>
    api.patch<Counseling>(`/counseling/${id}`, input),

  reschedule: (
    id: string,
    input: RescheduleCounselingInput,
  ): Promise<Counseling> =>
    api.post<Counseling>(`/counseling/${id}/reschedule`, input),

  cancel: (id: string, input: CancelCounselingInput): Promise<Counseling> =>
    api.post<Counseling>(`/counseling/${id}/cancel`, input),

  attend: (id: string, input: AttendCounselingInput): Promise<Counseling> =>
    api.post<Counseling>(`/counseling/${id}/attend`, input),

  noShow: (id: string, input: NoShowCounselingInput): Promise<Counseling> =>
    api.post<Counseling>(`/counseling/${id}/no-show`, input),
};