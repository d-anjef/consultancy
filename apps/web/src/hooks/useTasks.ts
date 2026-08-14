'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type Task, type ListTasksParams, type CreateTaskInput } from '@/lib/api/tasks';

export function useTasks(params: ListTasksParams = {}) {
  return useQuery({ queryKey: ['tasks', params], queryFn: () => tasksApi.list(params), staleTime: 30_000 });
}

export function useTask(id: string) {
  return useQuery({ queryKey: ['tasks', id], queryFn: () => tasksApi.getById(id), enabled: !!id });
}

export function useTaskCounts() {
  return useQuery({ queryKey: ['tasks', 'counts'], queryFn: () => tasksApi.getCounts(), staleTime: 60_000 });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: CreateTaskInput) => tasksApi.create(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); } });
}

export function useCompleteTask(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (notes?: string) => tasksApi.complete(id, notes), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); } });
}

export function useCancelTask(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (reason?: string) => tasksApi.cancel(id, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); } });
}