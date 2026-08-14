import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskType = 'CALL' | 'MESSAGE' | 'DOCUMENT_REMINDER' | 'PAYMENT_REMINDER' | 'COUNSELING_FOLLOWUP' | 'APPLICATION_FOLLOWUP' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  taskNumber: string;
  branch: { id: string; code: string; name: string };
  relatedTo: { entityType: string; entityId: string };
  taskType: TaskType;
  title: string;
  description?: string;
  assignedTo: { id: string; email: string; firstName: string; lastName: string };
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  isOverdue: boolean;
  completedAt?: string;
  completedBy?: { id: string; firstName: string; lastName: string } | null;
  completionNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface TaskCounts {
  today: number;
  overdue: number;
  upcoming: number;
  total: number;
}

export interface ListTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  taskType?: TaskType;
  priority?: TaskPriority;
  branchId?: string;
  assignedToId?: string;
  entityType?: string;
  entityId?: string;
  today?: boolean;
  overdue?: boolean;
  upcoming?: boolean;
}

export interface CreateTaskInput {
  relatedTo: { entityType: 'LEAD' | 'STUDENT' | 'APPLICATION'; entityId: string };
  taskType: TaskType;
  title: string;
  description?: string;
  assignedToId: string;
  priority?: TaskPriority;
  dueDate: string;
}

export const tasksApi = {
  list: async (params: ListTasksParams = {}) => {
    const items = await api.get<Task[]>('/tasks', params as Record<string, unknown>);
    return {
      items,
      pagination: { page: params.page || 1, limit: params.limit || 20, total: items.length, totalPages: 1, hasNext: false, hasPrev: false } as PaginationMeta,
    };
  },
  getById: (id: string): Promise<Task> => api.get<Task>(`/tasks/${id}`),
  create: (input: CreateTaskInput): Promise<Task> => api.post<Task>('/tasks', input),
  update: (id: string, input: Partial<CreateTaskInput>): Promise<Task> => api.patch<Task>(`/tasks/${id}`, input),
  complete: (id: string, notes?: string): Promise<Task> => api.post<Task>(`/tasks/${id}/complete`, { notes }),
  cancel: (id: string, reason?: string): Promise<Task> => api.post<Task>(`/tasks/${id}/cancel`, { reason }),
  getCounts: (): Promise<TaskCounts> => api.get<TaskCounts>('/tasks/counts'),
};