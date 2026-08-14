'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  classesApi,
  type ClassEntity,
  type ListClassesParams,
  type CreateClassInput,
} from '@/lib/api/classes';

export function useClasses(params: ListClassesParams = {}) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => classesApi.list(params),
    staleTime: 60_000,
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => classesApi.getById(id),
    enabled: !!id,
  });
}

export function useMyClasses() {
  return useQuery({
    queryKey: ['classes', 'me'],
    queryFn: () => classesApi.getMyClasses(),
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClassInput) => classesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useEnrollStudents(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentIds: string[]) => classesApi.enroll(classId, studentIds),
    onSuccess: (updated: ClassEntity) => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.setQueryData(['classes', classId], updated);
    },
  });
}

export function useUnenrollStudents(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentIds: string[]) => classesApi.unenroll(classId, studentIds),
    onSuccess: (updated: ClassEntity) => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.setQueryData(['classes', classId], updated);
    },
  });
}