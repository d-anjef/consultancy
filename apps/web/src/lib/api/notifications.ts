import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type NotificationCategory =
  | 'COUNSELING' | 'DOCUMENTS' | 'APPLICATIONS' | 'FINANCE'
  | 'ATTENDANCE' | 'TASKS' | 'ANNOUNCEMENTS' | 'SYSTEM';

export interface Notification {
  id: string;
  event: string;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata?: {
    entityType?: string;
    entityId?: string;
    deepLink?: string;
  };
  isRead: boolean;
  readAt?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
}

export const notificationsApi = {
  list: async (page = 1, limit = 20, category?: NotificationCategory) => {
    const items = await api.get<Notification[]>('/notifications', { page, limit, category });
    return {
      items,
      pagination: { page, limit, total: items.length, totalPages: 1, hasNext: false, hasPrev: false } as PaginationMeta,
    };
  },

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string): Promise<void> =>
    api.patch<void>(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<void> =>
    api.patch<void>('/notifications/read-all'),
};