'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  leadsApi,
  type Lead,
  type ListLeadsParams,
  type CreateLeadInput,
  type UpdateLeadInput,
  type UpdateLeadStatusInput,
  type AssignLeadInput,
} from '@/lib/api/leads';

export function useLeads(params: ListLeadsParams = {}) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.list(params),
    staleTime: 30_000,
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: ['leads', 'stats'],
    queryFn: () => leadsApi.stats(),
    staleTime: 60_000,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => leadsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLeadInput) => leadsApi.update(id, input),
    onSuccess: (updated: Lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['leads', id], updated);
    },
  });
}

export function useTransitionLeadStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLeadStatusInput) => leadsApi.updateStatus(id, input),
    onSuccess: (updated: Lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['leads', id], updated);
    },
  });
}

export function useAssignCounselor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignLeadInput) => leadsApi.assign(id, input),
    onSuccess: (updated: Lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.setQueryData(['leads', id], updated);
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}