'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  languageLevelsApi,
  type LanguageLevel,
  type CreateLanguageLevelInput,
  type UpdateLanguageLevelInput,
} from '@/lib/api/language-levels';

export function useLanguageLevels(includeInactive = false) {
  return useQuery({
    queryKey: ['language-levels', { includeInactive }],
    queryFn: () => languageLevelsApi.list(includeInactive),
    staleTime: 5 * 60_000,
  });
}

export function useLanguageLevel(id: string) {
  return useQuery({
    queryKey: ['language-levels', id],
    queryFn: () => languageLevelsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateLanguageLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLanguageLevelInput) => languageLevelsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['language-levels'] });
    },
  });
}

export function useUpdateLanguageLevel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLanguageLevelInput) => languageLevelsApi.update(id, input),
    onSuccess: (updated: LanguageLevel) => {
      qc.invalidateQueries({ queryKey: ['language-levels'] });
      qc.setQueryData(['language-levels', id], updated);
    },
  });
}

export function useDeleteLanguageLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => languageLevelsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['language-levels'] });
    },
  });
}