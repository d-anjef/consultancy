'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  counselingApi,
  type Counseling,
  type ListCounselingParams,
  type CreateCounselingInput,
  type UpdateCounselingInput,
  type RescheduleCounselingInput,
  type CancelCounselingInput,
  type AttendCounselingInput,
  type NoShowCounselingInput,
} from '@/lib/api/counseling';

export function useCounselings(params: ListCounselingParams = {}) {
  return useQuery({
    queryKey: ['counseling', params],
    queryFn: () => counselingApi.list(params),
    staleTime: 30_000,
  });
}

export function useCounseling(id: string) {
  return useQuery({
    queryKey: ['counseling', id],
    queryFn: () => counselingApi.getById(id),
    enabled: !!id,
  });
}

export function useCounselingByLead(leadId: string) {
  return useQuery({
    queryKey: ['counseling', 'byLead', leadId],
    queryFn: () => counselingApi.list({ leadId }),
    enabled: !!leadId,
  });
}

export function useCreateCounseling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCounselingInput) => counselingApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['counseling'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateCounseling(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCounselingInput) => counselingApi.update(id, input),
    onSuccess: (updated: Counseling) => {
      qc.invalidateQueries({ queryKey: ['counseling'] });
      qc.setQueryData(['counseling', id], updated);
    },
  });
}

export function useRescheduleCounseling(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RescheduleCounselingInput) =>
      counselingApi.reschedule(id, input),
    onSuccess: (updated: Counseling) => {
      qc.invalidateQueries({ queryKey: ['counseling'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['counseling', id], updated);
    },
  });
}

export function useCancelCounseling(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelCounselingInput) =>
      counselingApi.cancel(id, input),
    onSuccess: (updated: Counseling) => {
      qc.invalidateQueries({ queryKey: ['counseling'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['counseling', id], updated);
    },
  });
}

export function useAttendCounseling(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendCounselingInput) =>
      counselingApi.attend(id, input),
    onSuccess: (updated: Counseling) => {
      qc.invalidateQueries({ queryKey: ['counseling'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['counseling', id], updated);
    },
  });
}

export function useNoShowCounseling(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NoShowCounselingInput) =>
      counselingApi.noShow(id, input),
    onSuccess: (updated: Counseling) => {
      qc.invalidateQueries({ queryKey: ['counseling'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['counseling', id], updated);
    },
  });
}

// Aliases for legacy naming
export const useScheduleCounseling = useCreateCounseling;
export const useMarkAttended = useAttendCounseling;
export const useMarkNoShow = useNoShowCounseling;
export const useRecordOutcome = useAttendCounseling;