'use client';

import { useQuery } from '@tanstack/react-query';
import { teachersApi, type ListTeachersParams } from '@/lib/api/teachers';

export function useTeachers(params: ListTeachersParams = {}) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => teachersApi.list(params),
    staleTime: 60_000,
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => teachersApi.getById(id),
    enabled: !!id,
  });
}

export function useMyTeacherProfile() {
  return useQuery({
    queryKey: ['teachers', 'me'],
    queryFn: () => teachersApi.getMe(),
  });
}