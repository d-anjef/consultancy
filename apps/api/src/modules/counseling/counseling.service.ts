import { Types } from 'mongoose';
import {
  COUNSELING_STATUSES,
  COUNSELING_STATUS_TRANSITIONS,
  LEAD_STATUSES,
  ORGANIZATION_WIDE_ROLE_CODES,
  type RoleCode,
  type CounselingStatus,
} from '@consultancy/config';
import { counselingRepository } from './counseling.repository.js';
import { leadRepository } from '../leads/lead.repository.js';
import { userRepository } from '../users/user.repository.js';
import { notificationService } from '../notifications/notification.service.js';
import { emailService } from '../auth/email.service.js';
import { logger } from '../../lib/logger.js';
import { LeadModel } from '../leads/lead.model.js';
import type { CounselingDocument } from './counseling.model.js';
import type { LeadDocument } from '../leads/lead.model.js';
import type { UserDocument } from '../users/user.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateCounselingNumber } from '../../lib/studentId.js';
import { isDateInPast } from '../../lib/timezone.js';
import type {
  CreateCounselingDto,
  UpdateCounselingDto,
  RescheduleCounselingDto,
  CancelCounselingDto,
  AttendCounselingDto,
  NoShowCounselingDto,
  ListCounselingQueryDto,
} from './counseling.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedCounseling {
  id: string;
  counselingNumber: string;
  lead: {
    id: string;
    leadNumber: string;
    firstName: string;
    lastName: string;
    status: string;
  };
  branch: { id: string; code: string; name: string };
  counselor: { id: string; email: string; firstName: string; lastName: string };
  scheduledDate: Date;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
  attendedAt?: Date;
  outcome?: { result?: string; notes?: string; nextSteps?: string };
  followUpDate?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

function extractBranchId(branch: unknown): string | null {
  if (!branch) return null;
  if (typeof branch === 'string') return branch;
  const b = branch as { _id?: unknown };
  if (b._id) return String(b._id);
  return String(branch);
}

export class CounselingService {
  async listCounseling(
    query: ListCounselingQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedCounseling[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await counselingRepository.list(
      {
        branchId: branchFilter,
        counselorId: query.counselorId,
        leadId: query.leadId,
        status: query.status as CounselingStatus | undefined,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((c) => this.format(c)), pagination };
  }

  async getCounselingById(id: string, actor: ActorContext): Promise<FormattedCounseling> {
    const counseling = await counselingRepository.findById(id);
    if (!counseling) throw new NotFoundError('Counseling', id);
    this.enforceBranchAccess(counseling, actor);
    return this.format(counseling);
  }

  async createCounseling(
    data: CreateCounselingDto,
    actor: ActorContext,
  ): Promise<FormattedCounseling> {
    const lead = await leadRepository.findById(data.leadId);
    if (!lead) throw new NotFoundError('Lead', data.leadId);

    if (lead.status === LEAD_STATUSES.CONVERTED || lead.status === LEAD_STATUSES.LOST) {
      throw new BusinessRuleError(
        `Cannot schedule counseling for a lead in status: ${lead.status}`,
      );
    }

    const leadBranchId = extractBranchId(lead.branch);
    if (!leadBranchId) {
      throw new BusinessRuleError('Lead has no branch assigned');
    }

    if (
      !ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role) &&
      leadBranchId !== actor.branch
    ) {
      throw new ForbiddenError("You do not have access to this lead's branch");
    }

    const counselor = await userRepository.findById(data.counselorId);
    if (!counselor) throw new NotFoundError('Counselor', data.counselorId);

    const counselorBranchId = extractBranchId(counselor.branch);
    if (counselorBranchId !== leadBranchId) {
      throw new BusinessRuleError('Counselor must be from the same branch as the lead');
    }

    const scheduledDate = new Date(data.scheduledDate);
    if (isDateInPast(scheduledDate)) {
      throw new BusinessRuleError('Cannot schedule counseling in the past');
    }

    const conflict = await counselingRepository.findConflicting(
      counselor._id as Types.ObjectId,
      scheduledDate,
      data.scheduledTime,
      data.durationMinutes || 60,
    );
    if (conflict) {
      throw new ConflictError(
        `Counselor already has a session at that time (${conflict.counselingNumber})`,
      );
    }

    const counselingNumber = await generateCounselingNumber();

    const created = await counselingRepository.create({
      counselingNumber,
      lead: lead._id as Types.ObjectId,
      branch: (lead.branch as unknown as BranchDocument)._id as Types.ObjectId,
      counselor: counselor._id as Types.ObjectId,
      scheduledDate,
      scheduledTime: data.scheduledTime,
      durationMinutes: data.durationMinutes,
      createdBy: new Types.ObjectId(actor.id),
    });

    if (lead.status === LEAD_STATUSES.NEW || lead.status === LEAD_STATUSES.CONTACTED) {
      await LeadModel.findByIdAndUpdate(lead._id, {
        $set: {
          status: LEAD_STATUSES.COUNSELING_BOOKED,
          updatedBy: new Types.ObjectId(actor.id),
        },
      });
    }

    // ═══ NOTIFY (fire-and-forget) ═══
    this.notifyCounselingScheduled(created).catch((err: unknown) =>
      logger.warn({ err, counselingId: created._id }, 'Counseling notification failed (non-blocking)'),
    );

    return this.format(created);
  }

  async updateCounseling(
    id: string,
    data: UpdateCounselingDto,
    actor: ActorContext,
  ): Promise<FormattedCounseling> {
    const existing = await counselingRepository.findById(id);
    if (!existing) throw new NotFoundError('Counseling', id);
    this.enforceBranchAccess(existing, actor);

    if (existing.status !== COUNSELING_STATUSES.BOOKED) {
      throw new BusinessRuleError(`Cannot edit counseling in status: ${existing.status}`);
    }

    const scheduledDate = data.scheduledDate
      ? new Date(data.scheduledDate)
      : existing.scheduledDate;
    const scheduledTime = data.scheduledTime || existing.scheduledTime;
    const durationMinutes = data.durationMinutes ?? existing.durationMinutes;
    const counselorId = data.counselorId
      ? new Types.ObjectId(data.counselorId)
      : ((existing.counselor as unknown as UserDocument)._id as Types.ObjectId);

    const conflict = await counselingRepository.findConflicting(
      counselorId,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      id,
    );
    if (conflict) {
      throw new ConflictError(
        `Counselor already has a session at that time (${conflict.counselingNumber})`,
      );
    }

    const updated = await counselingRepository.update(id, {
      scheduledDate,
      scheduledTime,
      durationMinutes,
      counselor: counselorId,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Counseling', id);
    return this.format(updated);
  }

  async rescheduleCounseling(
    id: string,
    data: RescheduleCounselingDto,
    actor: ActorContext,
  ): Promise<FormattedCounseling> {
    const existing = await counselingRepository.findById(id);
    if (!existing) throw new NotFoundError('Counseling', id);
    this.enforceBranchAccess(existing, actor);

    if (!['BOOKED', 'RESCHEDULED', 'NO_SHOW'].includes(existing.status)) {
      throw new InvalidStateTransitionError('Counseling', existing.status, 'RESCHEDULED');
    }

    const newDate = new Date(data.scheduledDate);
    if (isDateInPast(newDate)) {
      throw new BusinessRuleError('Cannot reschedule to a past date');
    }

    const conflict = await counselingRepository.findConflicting(
      (existing.counselor as unknown as UserDocument)._id as Types.ObjectId,
      newDate,
      data.scheduledTime,
      existing.durationMinutes,
      id,
    );
    if (conflict) {
      throw new ConflictError(
        `Counselor already has a session at that time (${conflict.counselingNumber})`,
      );
    }

    const updated = await counselingRepository.recordReschedule(
      id,
      existing.scheduledDate,
      existing.scheduledTime,
      newDate,
      data.scheduledTime,
      new Types.ObjectId(actor.id),
      data.reason,
    );

    if (!updated) throw new NotFoundError('Counseling', id);

    // ═══ NOTIFY (fire-and-forget, safe after null check) ═══
    this.notifyCounselingRescheduled(
      updated,
      existing.scheduledDate,
      existing.scheduledTime,
      data.reason,
    ).catch((err: unknown) =>
      logger.warn({ err, counselingId: updated._id }, 'Counseling reschedule notification failed'),
    );

    return this.format(updated);
  }

  async cancelCounseling(
    id: string,
    data: CancelCounselingDto,
    actor: ActorContext,
  ): Promise<FormattedCounseling> {
    const existing = await counselingRepository.findById(id);
    if (!existing) throw new NotFoundError('Counseling', id);
    this.enforceBranchAccess(existing, actor);

    const allowed = COUNSELING_STATUS_TRANSITIONS[existing.status as CounselingStatus];
    if (!allowed.includes(COUNSELING_STATUSES.CANCELLED)) {
      throw new InvalidStateTransitionError('Counseling', existing.status, 'CANCELLED');
    }

    const updated = await counselingRepository.cancel(
      id,
      data.reason,
      new Types.ObjectId(actor.id),
    );
    if (!updated) throw new NotFoundError('Counseling', id);
    return this.format(updated);
  }

  async markAttended(
    id: string,
    data: AttendCounselingDto,
    actor: ActorContext,
  ): Promise<FormattedCounseling> {
    const existing = await counselingRepository.findById(id);
    if (!existing) throw new NotFoundError('Counseling', id);
    this.enforceBranchAccess(existing, actor);

    const allowed = COUNSELING_STATUS_TRANSITIONS[existing.status as CounselingStatus];
    if (!allowed.includes(COUNSELING_STATUSES.ATTENDED)) {
      throw new InvalidStateTransitionError('Counseling', existing.status, 'ATTENDED');
    }

    const outcomePayload = data.outcome
      ? {
          result: data.outcome.result,
          notes: data.outcome.notes,
          nextSteps: data.outcome.nextSteps,
          recommendedProgram: data.outcome.recommendedProgramId
            ? new Types.ObjectId(data.outcome.recommendedProgramId)
            : undefined,
          recommendedVisaCategory: data.outcome.recommendedVisaCategoryId
            ? new Types.ObjectId(data.outcome.recommendedVisaCategoryId)
            : undefined,
        }
      : undefined;

    const updated = await counselingRepository.recordOutcome(
      id,
      'ATTENDED',
      data.attendedAt ? new Date(data.attendedAt) : new Date(),
      outcomePayload,
      data.followUpDate ? new Date(data.followUpDate) : undefined,
      new Types.ObjectId(actor.id),
    );

    if (data.outcome?.result && updated) {
      const leadId = (updated.lead as unknown as LeadDocument)._id;
      let newLeadStatus: string | null = null;

      if (data.outcome.result === 'QUALIFIED') newLeadStatus = LEAD_STATUSES.QUALIFIED;
      else if (data.outcome.result === 'NOT_QUALIFIED') newLeadStatus = LEAD_STATUSES.NOT_INTERESTED;
      else if (data.outcome.result === 'NEEDS_FOLLOWUP') newLeadStatus = LEAD_STATUSES.FOLLOW_UP;

      if (newLeadStatus) {
        await LeadModel.findByIdAndUpdate(leadId, {
          $set: { status: newLeadStatus, updatedBy: new Types.ObjectId(actor.id) },
        });
      } else {
        await LeadModel.findByIdAndUpdate(leadId, {
          $set: {
            status: LEAD_STATUSES.COUNSELING_ATTENDED,
            updatedBy: new Types.ObjectId(actor.id),
          },
        });
      }
    }

    if (!updated) throw new NotFoundError('Counseling', id);
    return this.format(updated);
  }

  async markNoShow(
    id: string,
    _data: NoShowCounselingDto,
    actor: ActorContext,
  ): Promise<FormattedCounseling> {
    const existing = await counselingRepository.findById(id);
    if (!existing) throw new NotFoundError('Counseling', id);
    this.enforceBranchAccess(existing, actor);

    const allowed = COUNSELING_STATUS_TRANSITIONS[existing.status as CounselingStatus];
    if (!allowed.includes(COUNSELING_STATUSES.NO_SHOW)) {
      throw new InvalidStateTransitionError('Counseling', existing.status, 'NO_SHOW');
    }

    const updated = await counselingRepository.recordOutcome(
      id,
      'NO_SHOW',
      undefined,
      undefined,
      undefined,
      new Types.ObjectId(actor.id),
    );

    if (updated) {
      const leadId = (updated.lead as unknown as LeadDocument)._id;
      await LeadModel.findByIdAndUpdate(leadId, {
        $set: {
          status: LEAD_STATUSES.NO_SHOW,
          updatedBy: new Types.ObjectId(actor.id),
        },
      });
    }

    if (!updated) throw new NotFoundError('Counseling', id);
    return this.format(updated);
  }

  private enforceBranchAccess(counseling: CounselingDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branch = counseling.branch as unknown as BranchDocument | null;
    const branchId = branch?._id ? String(branch._id) : null;
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this counseling's branch");
    }
  }

  // ═══════════════════════════════════════════════════
  // NOTIFICATION HELPERS
  // ═══════════════════════════════════════════════════

  private async notifyCounselingScheduled(counseling: CounselingDocument): Promise<void> {
    const lead = counseling.lead as unknown as LeadDocument | null;
    const counselor = counseling.counselor as unknown as UserDocument | null;
    const branch = counseling.branch as unknown as BranchDocument | null;

    if (!lead?._id) return;

    // Safely extract lead contact email
    const leadContact = (lead as unknown as { contact?: { email?: string } }).contact;
    const leadPersonal = (lead as unknown as { personal?: { firstName?: string; lastName?: string } }).personal;

    if (!leadContact?.email) return;

    const leadName = `${leadPersonal?.firstName ?? ''} ${leadPersonal?.lastName ?? ''}`.trim();
    const counselorName = counselor
      ? `${counselor.profile?.firstName ?? ''} ${counselor.profile?.lastName ?? ''}`.trim()
      : 'Your counselor';

    // Email the lead
    await emailService.sendCounselingScheduled({
      to: leadContact.email,
      recipientName: leadName || 'Applicant',
      counselingNumber: counseling.counselingNumber,
      scheduledDate: counseling.scheduledDate,
      scheduledTime: counseling.scheduledTime,
      counselorName,
      branchName: branch?.name ?? 'our office',
    });

    // Also notify the counselor in-app
    if (counselor?._id) {
      await notificationService.create({
        recipientId: String(counselor._id),
        recipientRole: 'COUNSELOR',
        branchId: branch?._id ? String(branch._id) : undefined,
        event: 'COUNSELING_ASSIGNED',
        category: 'COUNSELING',
        title: 'Counseling Scheduled',
        message: `Session with ${leadName || 'lead'} on ${counseling.scheduledDate.toLocaleDateString()} at ${counseling.scheduledTime}`,
        metadata: {
          entityType: 'Counseling',
          entityId: String(counseling._id),
          deepLink: '/counseling',
        },
        priority: 'NORMAL',
      });
    }
  }

  private async notifyCounselingRescheduled(
    counseling: CounselingDocument,
    oldDate: Date,
    oldTime: string,
    reason?: string,
  ): Promise<void> {
    const lead = counseling.lead as unknown as LeadDocument | null;
    if (!lead?._id) return;

    const leadContact = (lead as unknown as { contact?: { email?: string } }).contact;
    const leadPersonal = (lead as unknown as { personal?: { firstName?: string; lastName?: string } }).personal;

    if (!leadContact?.email) return;

    const leadName = `${leadPersonal?.firstName ?? ''} ${leadPersonal?.lastName ?? ''}`.trim();

    await emailService.sendCounselingRescheduled({
      to: leadContact.email,
      recipientName: leadName || 'Applicant',
      counselingNumber: counseling.counselingNumber,
      oldDate,
      oldTime,
      newDate: counseling.scheduledDate,
      newTime: counseling.scheduledTime,
      reason,
    });
  }

  private format(c: CounselingDocument): FormattedCounseling {
    const lead = c.lead as unknown as LeadDocument | null;
    const branch = c.branch as unknown as BranchDocument | null;
    const counselor = c.counselor as unknown as UserDocument | null;

    const leadPersonal = lead
      ? (lead as unknown as { personal?: { firstName?: string; lastName?: string } }).personal
      : null;

    return {
      id: String(c._id),
      counselingNumber: c.counselingNumber,
      lead: lead?._id
        ? {
            id: String(lead._id),
            leadNumber: lead.leadNumber ?? '',
            firstName: leadPersonal?.firstName ?? '',
            lastName: leadPersonal?.lastName ?? '',
            status: lead.status ?? '',
          }
        : {
            id: '',
            leadNumber: 'DELETED',
            firstName: 'Deleted',
            lastName: 'Lead',
            status: '',
          },
      branch: branch?._id
        ? { id: String(branch._id), code: branch.code, name: branch.name }
        : { id: '', code: 'N/A', name: 'Unknown Branch' },
      counselor: counselor?._id
        ? {
            id: String(counselor._id),
            email: counselor.email,
            firstName: counselor.profile?.firstName ?? '',
            lastName: counselor.profile?.lastName ?? '',
          }
        : {
            id: '',
            email: 'unassigned',
            firstName: 'Unassigned',
            lastName: '',
          },
      scheduledDate: c.scheduledDate,
      scheduledTime: c.scheduledTime,
      durationMinutes: c.durationMinutes,
      status: c.status,
      attendedAt: c.attendedAt,
      outcome: c.outcome
        ? {
            result: c.outcome.result,
            notes: c.outcome.notes,
            nextSteps: c.outcome.nextSteps,
          }
        : undefined,
      followUpDate: c.followUpDate,
      cancellationReason: c.cancellationReason,
      cancelledAt: c.cancelledAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}

export const counselingService = new CounselingService();