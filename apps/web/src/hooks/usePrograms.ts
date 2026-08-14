'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  programsApi,
  type Program,
  type CreateProgramInput,
  type UpdateProgramInput,
} from '@/lib/api/programs';

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: () => programsApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: () => programsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProgramInput) => programsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useUpdateProgram(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProgramInput) => programsApi.update(id, input),
    onSuccess: (updated: Program) => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      qc.setQueryData(['programs', id], updated);
    },
  });
}