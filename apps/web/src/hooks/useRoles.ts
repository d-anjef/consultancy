'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rolesApi,
  type RoleDetail,
  type CreateRoleInput,
  type UpdateRoleInput,
} from '@/lib/api/roles';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
    staleTime: 2 * 60_000,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => rolesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) => rolesApi.update(id, input),
    onSuccess: (updated: RoleDetail) => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.setQueryData(['roles', id], updated);
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}