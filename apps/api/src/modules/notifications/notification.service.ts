import { Types } from 'mongoose';
import { NotificationModel, type NotificationDocument, type NotificationCategory, type NotificationPriority } from './notification.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import { pushService } from '../push/push.service.js';

export interface CreateNotificationInput {
  recipientId: string;
  recipientRole: string;
  branchId?: string;
  event: string;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata?: {
    entityType?: string;
    entityId?: string;
    deepLink?: string;
  };
  priority?: NotificationPriority;
  isMandatory?: boolean;
}

export interface FormattedNotification {
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
  readAt?: Date;
  priority: NotificationPriority;
  createdAt: Date;
}

export class NotificationService {
  async create(input: CreateNotificationInput): Promise<FormattedNotification> {
    const notification = await NotificationModel.create({
      recipient: new Types.ObjectId(input.recipientId),
      recipientRole: input.recipientRole,
      branch: input.branchId ? new Types.ObjectId(input.branchId) : undefined,
      event: input.event,
      category: input.category,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      channel: 'IN_APP',
      priority: input.priority ?? 'NORMAL',
      isMandatory: input.isMandatory ?? false,
    });

    // ═══ AUTO-SEND PUSH for HIGH / URGENT notifications ═══
    const priority = input.priority ?? 'NORMAL';
    if (priority === 'HIGH' || priority === 'URGENT') {
      pushService
        .sendToUser(input.recipientId, {
          title: input.title,
          body: input.message,
          tag: input.event,
          data: {
            url: input.metadata?.deepLink ?? '/notifications',
            entityType: input.metadata?.entityType,
            entityId: input.metadata?.entityId,
          },
          requireInteraction: priority === 'URGENT',
        })
        .catch(() => {
          // Silent fail — don't block notification creation
        });
    }

    return this.format(notification.toObject() as NotificationDocument);
  }

  async createBulk(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;

    const docs = inputs.map((input) => ({
      recipient: new Types.ObjectId(input.recipientId),
      recipientRole: input.recipientRole,
      branch: input.branchId ? new Types.ObjectId(input.branchId) : undefined,
      event: input.event,
      category: input.category,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      channel: 'IN_APP' as const,
      priority: input.priority ?? 'NORMAL',
      isMandatory: input.isMandatory ?? false,
    }));
    await NotificationModel.insertMany(docs);

    // ═══ AUTO-SEND PUSH for HIGH / URGENT bulk notifications ═══
    const highPriorityInputs = inputs.filter(
      (i) => i.priority === 'HIGH' || i.priority === 'URGENT',
    );

    if (highPriorityInputs.length > 0) {
      const first = highPriorityInputs[0];
      // TypeScript narrowing — first is guaranteed to exist after length check
      if (!first) return;

      const userIds = highPriorityInputs.map((i) => i.recipientId);

      pushService
        .sendToUsers(userIds, {
          title: first.title,
          body: first.message,
          tag: first.event,
          data: {
            url: first.metadata?.deepLink ?? '/notifications',
          },
        })
        .catch(() => {
          // Silent fail
        });
    }
  }

  async listForUser(
    userId: string,
    page: number,
    limit: number,
    category?: NotificationCategory,
  ): Promise<{ items: FormattedNotification[]; pagination: PaginationMeta }> {
    const query: Record<string, unknown> = {
      recipient: new Types.ObjectId(userId),
    };
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<NotificationDocument[]>(),
      NotificationModel.countDocuments(query),
    ]);

    return {
      items: items.map((n) => this.format(n)),
      pagination: createPaginationMeta(page, limit, total),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationModel.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await NotificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), recipient: new Types.ObjectId(userId) },
      { $set: { isRead: true, readAt: new Date() } },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { recipient: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
  }

  private format(n: NotificationDocument): FormattedNotification {
    return {
      id: String(n._id),
      event: n.event,
      category: n.category,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      isRead: n.isRead,
      readAt: n.readAt,
      priority: n.priority,
      createdAt: n.createdAt,
    };
  }
}

export const notificationService = new NotificationService();