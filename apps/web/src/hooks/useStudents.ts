'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  studentsApi,
  type Student,
  type ListStudentsParams,
  type CreateStudentInput,
  type UpdateStudentInput,
  type TransferStudentBranchInput,
} from '@/lib/api/students';

export function useStudents(params: ListStudentsParams = {}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.list(params),
    staleTime: 30_000,
  });
}

export function useStudentStats() {
  return useQuery({
    queryKey: ['students', 'stats'],
    queryFn: () => studentsApi.stats(),
    staleTime: 60_000,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useMyStudentProfile() {
  return useQuery({
    queryKey: ['students', 'me'],
    queryFn: () => studentsApi.getMe(),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStudentInput) => studentsApi.update(id, input),
    onSuccess: (updated: Student) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.setQueryData(['students', id], updated);
    },
  });
}

export function useUpdateMyStudentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStudentInput) => studentsApi.updateMe(input),
    onSuccess: (updated: Student) => {
      qc.setQueryData(['students', 'me'], updated);
    },
  });
}

export function useArchiveStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentsApi.archive(id),
    onSuccess: (updated: Student) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.setQueryData(['students', id], updated);
    },
  });
}

export function useTransferStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferStudentBranchInput) => studentsApi.transfer(id, input),
    onSuccess: (updated: Student) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.setQueryData(['students', id], updated);
    },
  });
}