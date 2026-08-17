import { Types } from 'mongoose';
import { AnnouncementModel, type AnnouncementDocument } from './announcement.model.js';
import { UserModel } from '../users/user.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { emailService } from '../auth/email.service.js';
import { logger } from '../../lib/logger.js';
import { NotFoundError, ForbiddenError } from '../../lib/errors.js';
import { ROLE_CODES, type RoleCode } from '@consultancy/config';
import type {
  CreateAnnouncementDto,
  PreviewAnnouncementDto,
  ListAnnouncementsQueryDto,
} from './announcement.validators.js';
import type { PaginationMeta } from '@consultancy/types';
import { createPaginationMeta } from '../../lib/pagination.js';

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export interface FormattedAnnouncement {
  id: string;
  title: string;
  message: string;
  category: string;
  audience: string;
  branchIds?: string[];
  roleCodes?: string[];
  includeStudents: boolean;
  sendEmail: boolean;
  sendInApp: boolean;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentBy: { id: string; firstName: string; lastName: string; email: string };
  sentAt?: Date;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Recipient {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
}

interface LeanUser {
  _id: Types.ObjectId;
  email: string;
  profile?: { firstName?: string; lastName?: string };
  branch?: Types.ObjectId;
  role?: { code?: string };
}

export class AnnouncementService {
  private enforcePermission(actor: ActorContext): void {
    if (actor.role !== ROLE_CODES.SUPER_ADMIN && actor.role !== ROLE_CODES.ADMIN) {
      throw new ForbiddenError('Only Super Admin or Admin can send announcements');
    }
  }

  async preview(data: PreviewAnnouncementDto, actor: ActorContext): Promise<{ count: number }> {
    this.enforcePermission(actor);
    const recipients = await this.resolveRecipients(data);
    return { count: recipients.length };
  }

  async create(data: CreateAnnouncementDto, actor: ActorContext): Promise<FormattedAnnouncement> {
    this.enforcePermission(actor);

    const recipients = await this.resolveRecipients(data);

    const announcement = await AnnouncementModel.create({
      title: data.title,
      message: data.message,
      category: data.category,
      audience: data.audience,
      branchIds: data.branchIds?.map((id) => new Types.ObjectId(id)),
      roleCodes: data.roleCodes,
      includeStudents: data.includeStudents,
      sendEmail: data.sendEmail,
      sendInApp: data.sendInApp,
      status: 'SENDING',
      recipientCount: recipients.length,
      sentBy: new Types.ObjectId(actor.id),
    });

    // Fetch populated version for response
    const populated = await AnnouncementModel.findById(announcement._id)
      .populate('sentBy', 'email profile')
      .lean();

    // Dispatch in background — don't await
    this.dispatch(announcement, recipients).catch((err: unknown) =>
      logger.error({ err, announcementId: announcement._id }, 'Announcement dispatch failed'),
    );

    return this.format(populated as unknown as AnnouncementDocument);
  }

  async list(
    query: ListAnnouncementsQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedAnnouncement[]; pagination: PaginationMeta }> {
    this.enforcePermission(actor);

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      AnnouncementModel.find(filter)
        .populate('sentBy', 'email profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      AnnouncementModel.countDocuments(filter),
    ]);

    return {
      items: (items as unknown as AnnouncementDocument[]).map((a) => this.format(a)),
      pagination: createPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(id: string, actor: ActorContext): Promise<FormattedAnnouncement> {
    this.enforcePermission(actor);
    const ann = await AnnouncementModel.findById(id)
      .populate('sentBy', 'email profile')
      .lean();
    if (!ann) throw new NotFoundError('Announcement', id);
    return this.format(ann as unknown as AnnouncementDocument);
  }

  // ═══════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════

  private async resolveRecipients(data: {
    audience: string;
    branchIds?: string[];
    roleCodes?: string[];
    includeStudents: boolean;
  }): Promise<Recipient[]> {
    const users = await UserModel.find({ status: 'ACTIVE' })
      .populate('role', 'code')
      .lean();

    let filtered = (users as unknown as LeanUser[]).filter((u) => !!u.email);

    if (data.audience === 'ALL_STUDENTS') {
      filtered = filtered.filter((u) => u.role?.code === ROLE_CODES.STUDENT);
    } else if (data.audience === 'ALL_STAFF') {
      filtered = filtered.filter((u) => u.role?.code !== ROLE_CODES.STUDENT);
    } else if (data.audience === 'BY_BRANCH') {
      const branchIdSet = new Set(data.branchIds ?? []);
      filtered = filtered.filter((u) => u.branch && branchIdSet.has(String(u.branch)));
      if (!data.includeStudents) {
        filtered = filtered.filter((u) => u.role?.code !== ROLE_CODES.STUDENT);
      }
    } else if (data.audience === 'BY_ROLE') {
      const roleCodeSet = new Set(data.roleCodes ?? []);
      filtered = filtered.filter((u) => u.role?.code && roleCodeSet.has(u.role.code));
    } else if (data.audience === 'ALL_USERS') {
      if (!data.includeStudents) {
        filtered = filtered.filter((u) => u.role?.code !== ROLE_CODES.STUDENT);
      }
    }

    return filtered.map((u) => ({
      userId: String(u._id),
      email: u.email,
      firstName: u.profile?.firstName ?? '',
      lastName: u.profile?.lastName ?? '',
      role: u.role?.code ?? '',
      branchId: u.branch ? String(u.branch) : undefined,
    }));
  }

  private async dispatch(
    announcement: AnnouncementDocument,
    recipients: Recipient[],
  ): Promise<void> {
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    logger.info(
      { announcementId: announcement._id, recipientCount: recipients.length },
      'Starting announcement dispatch',
    );

    if (announcement.sendInApp) {
      try {
        await notificationService.createBulk(
          recipients.map((r) => ({
            recipientId: r.userId,
            recipientRole: r.role,
            branchId: r.branchId,
            event: 'ANNOUNCEMENT',
            category: 'ANNOUNCEMENTS',
            title: announcement.title,
            message: announcement.message.slice(0, 500),
            metadata: {
              entityType: 'Announcement',
              entityId: String(announcement._id),
              deepLink: '/notifications',
            },
            priority: announcement.category === 'NOTICE' ? 'HIGH' : 'NORMAL',
          })),
        );
      } catch (err) {
        logger.error({ err }, 'Bulk in-app notification failed');
        errors.push(`In-app: ${(err as Error).message}`);
      }
    }

    if (announcement.sendEmail) {
      for (const recipient of recipients) {
        try {
          await emailService.sendAnnouncementEmail({
            to: recipient.email,
            recipientName: `${recipient.firstName} ${recipient.lastName}`.trim() || 'there',
            title: announcement.title,
            message: announcement.message,
            category: announcement.category,
          });
          sentCount++;
        } catch (err) {
          failedCount++;
          const errMsg = `${recipient.email}: ${(err as Error).message}`;
          errors.push(errMsg);
          logger.warn({ err, recipient: recipient.email }, 'Failed to send announcement email');
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } else {
      sentCount = recipients.length;
    }

    await AnnouncementModel.findByIdAndUpdate(announcement._id, {
      $set: {
        status: failedCount === recipients.length ? 'FAILED' : 'SENT',
        sentCount,
        failedCount,
        sentAt: new Date(),
        errorLog: errors.length > 0 ? errors.slice(0, 50).join('\n') : undefined,
      },
    });

    logger.info(
      { announcementId: announcement._id, sentCount, failedCount },
      'Announcement dispatch complete',
    );
  }

  private format(a: AnnouncementDocument): FormattedAnnouncement {
    const sender = a.sentBy as unknown as {
      _id: Types.ObjectId;
      email: string;
      profile?: { firstName?: string; lastName?: string };
    } | null;

    return {
      id: String(a._id),
      title: a.title,
      message: a.message,
      category: a.category,
      audience: a.audience,
      branchIds: a.branchIds?.map((id) => String(id)),
      roleCodes: a.roleCodes,
      includeStudents: a.includeStudents,
      sendEmail: a.sendEmail,
      sendInApp: a.sendInApp,
      status: a.status,
      recipientCount: a.recipientCount,
      sentCount: a.sentCount,
      failedCount: a.failedCount,
      sentBy: sender?._id
        ? {
            id: String(sender._id),
            firstName: sender.profile?.firstName ?? '',
            lastName: sender.profile?.lastName ?? '',
            email: sender.email,
          }
        : { id: '', firstName: 'Deleted', lastName: 'User', email: 'deleted@user' },
      sentAt: a.sentAt,
      errorLog: a.errorLog,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}

export const announcementService = new AnnouncementService();