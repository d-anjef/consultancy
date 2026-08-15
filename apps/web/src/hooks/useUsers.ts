'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  type CreateUserInput,
  type UpdateUserInput,
  type ListUsersParams,
} from '@/lib/api/users';

export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
    staleTime: 30_000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: (id: string) => usersApi.resendInvitation(id),
  });
}