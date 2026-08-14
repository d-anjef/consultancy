'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applicationsApi,
  type Application,
  type ListApplicationsParams,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  type ChangeApplicationStatusInput,
  type CancelApplicationInput,
} from '@/lib/api/applications';

export function useApplications(params: ListApplicationsParams = {}) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationsApi.list(params),
    staleTime: 30_000,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id,
  });
}

export function useApplicationHistory(id: string) {
  return useQuery({
    queryKey: ['applications', id, 'history'],
    queryFn: () => applicationsApi.getHistory(id),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateApplicationInput) => applicationsApi.update(id, input),
    onSuccess: (updated: Application) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.setQueryData(['applications', id], updated);
    },
  });
}

export function useChangeApplicationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangeApplicationStatusInput) =>
      applicationsApi.changeStatus(id, input),
    onSuccess: (updated: Application) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['applications', id, 'history'] });
      qc.setQueryData(['applications', id], updated);
    },
  });
}

export function useCancelApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelApplicationInput) => applicationsApi.cancel(id, input),
    onSuccess: (updated: Application) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['applications', id, 'history'] });
      qc.setQueryData(['applications', id], updated);
    },
  });
}