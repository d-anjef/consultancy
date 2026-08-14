'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  visaCategoriesApi,
  type VisaCategory,
  type CreateVisaCategoryInput,
  type UpdateVisaCategoryInput,
} from '@/lib/api/visa-categories';

export function useVisaCategories() {
  return useQuery({
    queryKey: ['visa-categories'],
    queryFn: () => visaCategoriesApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useVisaCategory(id: string) {
  return useQuery({
    queryKey: ['visa-categories', id],
    queryFn: () => visaCategoriesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateVisaCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVisaCategoryInput) => visaCategoriesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visa-categories'] });
    },
  });
}

export function useUpdateVisaCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVisaCategoryInput) => visaCategoriesApi.update(id, input),
    onSuccess: (updated: VisaCategory) => {
      qc.invalidateQueries({ queryKey: ['visa-categories'] });
      qc.setQueryData(['visa-categories', id], updated);
    },
  });
}