import { Types } from 'mongoose';
import {
  LEAD_STATUSES,
  LEAD_STATUS_TRANSITIONS,
  ORGANIZATION_WIDE_ROLE_CODES,
  type LeadStatus,
  type RoleCode,
} from '@consultancy/config';
import { leadRepository } from './lead.repository.js';
import { branchRepository } from '../branches/branch.repository.js';
import { userRepository } from '../users/user.repository.js';
import type { LeadDocument } from './lead.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import type { UserDocument } from '../users/user.model.js';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateLeadNumber } from '../../lib/studentId.js';
import type {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  AssignLeadDto,
  ListLeadsQueryDto,
  LeadIntakeDto,
} from './lead.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedLead {
  id: string;
  leadNumber: string;
  branch: { id: string; code: string; name: string };
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    email?: string;
    gender?: string;
    dateOfBirth?: Date;
    occupation?: string;
  };
  address?: {
    permanentAddress?: string;
    presentAddress?: string;
  };
  education?: {
    lastEducation?: string;
    faculty?: string;
    japaneseLanguageHistory?: boolean;
    japanesePassedYear?: string;
    japaneseInstitute?: string;
  };
  preference?: {
    preferredCollege?: string;
    periodOfStudy?: string;
    preferredIntake?: string;
    previousVisaApply?: boolean;
  };
  family?: {
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
  };
  source: string;
  sourceMetadata?: {
    formId?: string;
    referredBy?: string;
    utmSource?: string;
    utmCampaign?: string;
    externalRef?: string;
  };
  interestedProgram?: { id: string; code: string; name: string } | null;
  interestedVisaCategory?: { id: string; code: string; name: string } | null;
  preferredCounseling?: { date?: Date; time?: string };
  assignedCounselor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  status: string;
  notes?: string;
  convertedToStudent?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  } | null;
  convertedAt?: Date;
  createdBy: { id: string; email: string; firstName: string; lastName: string };
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

function normalizeSourceMetadata(
  metadata: Record<string, string | undefined> | undefined,
): {
  formId?: string;
  referredBy?: string;
  utmSource?: string;
  utmCampaign?: string;
  externalRef?: string;
} | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, string> = {};
  if (metadata.formId) clean.formId = metadata.formId;
  if (metadata.referredBy) clean.referredBy = metadata.referredBy;
  if (metadata.utmSource) clean.utmSource = metadata.utmSource;
  if (metadata.utmCampaign) clean.utmCampaign = metadata.utmCampaign;
  if (metadata.externalRef) clean.externalRef = metadata.externalRef;
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export class LeadService {
  async listLeads(
    query: ListLeadsQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedLead[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await leadRepository.list(
      {
        branchId: branchFilter,
        search: query.search,
        status: query.status as LeadStatus | undefined,
        source: query.source as never,
        assignedCounselorId: query.assignedCounselorId,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((l) => this.formatLead(l)), pagination };
  }

  async getLeadById(id: string, actor: ActorContext): Promise<FormattedLead> {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new NotFoundError('Lead', id);
    this.enforceBranchAccess(lead, actor);
    return this.formatLead(lead);
  }

  async createLead(data: CreateLeadDto, actor: ActorContext): Promise<FormattedLead> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);

    if (!isOrgWide && actor.branch && data.branchId !== actor.branch) {
      throw new ForbiddenError('You can only create leads for your assigned branch');
    }

    const branch = await branchRepository.findById(data.branchId);
    if (!branch) throw new NotFoundError('Branch', data.branchId);

    const existing = await leadRepository.findByPhone(data.personal.phone, data.branchId);
    if (
      existing &&
      existing.status !== LEAD_STATUSES.LOST &&
      existing.status !== LEAD_STATUSES.CONVERTED
    ) {
      throw new ConflictError(
        `An active lead already exists with phone ${data.personal.phone} in this branch (${existing.leadNumber})`,
      );
    }

    let assignedCounselor: Types.ObjectId | undefined;
    if (data.assignedCounselorId) {
      const counselor = await userRepository.findById(data.assignedCounselorId);
      if (!counselor) throw new NotFoundError('Counselor', data.assignedCounselorId);
      assignedCounselor = counselor._id as Types.ObjectId;
    }

    const leadNumber = await generateLeadNumber();

    const created = await leadRepository.create({
      leadNumber,
      branch: branch._id as Types.ObjectId,
      personal: data.personal as never,
      address: data.address as never,
      education: data.education as never,
      preference: data.preference as never,
      family: data.family as never,
      source: data.source as never,
      sourceMetadata: normalizeSourceMetadata(data.sourceMetadata),
      interestedProgram: data.interestedProgramId
        ? new Types.ObjectId(data.interestedProgramId)
        : undefined,
      interestedVisaCategory: data.interestedVisaCategoryId
        ? new Types.ObjectId(data.interestedVisaCategoryId)
        : undefined,
      preferredCounseling: data.preferredCounseling
        ? {
            date: data.preferredCounseling.date
              ? new Date(data.preferredCounseling.date)
              : undefined,
            time: data.preferredCounseling.time,
          }
        : undefined,
      assignedCounselor,
      notes: data.notes,
      createdBy: new Types.ObjectId(actor.id),
    });

    return this.formatLead(created);
  }

  async updateLead(
    id: string,
    data: UpdateLeadDto,
    actor: ActorContext,
  ): Promise<FormattedLead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead', id);
    this.enforceBranchAccess(existing, actor);

    if (
      existing.status === LEAD_STATUSES.CONVERTED ||
      existing.status === LEAD_STATUSES.LOST
    ) {
      throw new BusinessRuleError(`Cannot edit leads in status: ${existing.status}`);
    }

    const updated = await leadRepository.update(id, {
      personal: data.personal as never,
      address: data.address as never,
      education: data.education as never,
      preference: data.preference as never,
      family: data.family as never,
      interestedProgram: data.interestedProgramId
        ? new Types.ObjectId(data.interestedProgramId)
        : undefined,
      interestedVisaCategory: data.interestedVisaCategoryId
        ? new Types.ObjectId(data.interestedVisaCategoryId)
        : undefined,
      notes: data.notes,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Lead', id);
    return this.formatLead(updated);
  }

  async updateStatus(
    id: string,
    data: UpdateLeadStatusDto,
    actor: ActorContext,
  ): Promise<FormattedLead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead', id);
    this.enforceBranchAccess(existing, actor);

    const currentStatus = existing.status;
    const newStatus = data.status as LeadStatus;

    if (currentStatus === newStatus) return this.formatLead(existing);

    if (newStatus === LEAD_STATUSES.CONVERTED) {
      throw new BusinessRuleError('Use the convert endpoint to transition to CONVERTED');
    }

    const allowed = LEAD_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStateTransitionError('Lead', currentStatus, newStatus);
    }

    const updated = await leadRepository.updateStatus(
      id,
      newStatus,
      new Types.ObjectId(actor.id),
    );
    if (!updated) throw new NotFoundError('Lead', id);
    return this.formatLead(updated);
  }

  async assignCounselor(
    id: string,
    data: AssignLeadDto,
    actor: ActorContext,
  ): Promise<FormattedLead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead', id);
    this.enforceBranchAccess(existing, actor);

    const counselor = await userRepository.findById(data.counselorId);
    if (!counselor) throw new NotFoundError('Counselor', data.counselorId);

    const leadBranchId = String((existing.branch as unknown as BranchDocument)._id);
    const counselorBranchId = counselor.branch ? String(counselor.branch) : null;
    if (counselorBranchId !== leadBranchId) {
      throw new BusinessRuleError(
        'Counselor must be assigned to the same branch as the lead',
      );
    }

    const updated = await leadRepository.assignCounselor(
      id,
      counselor._id as Types.ObjectId,
      new Types.ObjectId(actor.id),
    );
    if (!updated) throw new NotFoundError('Lead', id);
    return this.formatLead(updated);
  }

  async deleteLead(id: string, actor: ActorContext): Promise<void> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead', id);
    this.enforceBranchAccess(existing, actor);

    if (existing.convertedToStudent) {
      throw new BusinessRuleError(
        'Cannot delete a lead that has been converted to a student',
      );
    }

    await leadRepository.delete(id);
  }

  async intakeLead(data: LeadIntakeDto, systemUserId: string): Promise<FormattedLead> {
    let branch: BranchDocument | null = null;

    if (data.branchCode) {
      branch = await branchRepository.findByCode(data.branchCode);
      if (!branch) throw new NotFoundError('Branch', data.branchCode);
    } else {
      const activeBranches = await branchRepository.findActive();
      if (activeBranches.length === 0) {
        throw new BusinessRuleError('No active branches to receive leads');
      }
      branch = activeBranches[0]!;
    }

    if (!branch) {
      throw new BusinessRuleError('Failed to resolve branch for lead intake');
    }

    const branchId = branch._id as Types.ObjectId;

    const existing = await leadRepository.findByPhone(data.phone, String(branchId));
    if (
      existing &&
      existing.status !== LEAD_STATUSES.LOST &&
      existing.status !== LEAD_STATUSES.CONVERTED
    ) {
      return this.formatLead(existing);
    }

    const leadNumber = await generateLeadNumber();

    const sourceMetadata = normalizeSourceMetadata({
      formId: data.formId,
      externalRef: data.externalRef,
    });

    const created = await leadRepository.create({
      leadNumber,
      branch: branchId,
      personal: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        occupation: data.occupation,
      } as never,
      address: (data.permanentAddress || data.presentAddress)
        ? {
            permanentAddress: data.permanentAddress,
            presentAddress: data.presentAddress,
          } as never
        : undefined,
      education: (data.lastEducation || data.japaneseLanguageHistory !== undefined)
        ? {
            lastEducation: data.lastEducation,
            faculty: data.faculty,
            japaneseLanguageHistory: data.japaneseLanguageHistory,
            japanesePassedYear: data.japanesePassedYear,
            japaneseInstitute: data.japaneseInstitute,
          } as never
        : undefined,
      preference: (data.preferredCollege || data.preferredIntake || data.previousVisaApply !== undefined)
        ? {
            preferredCollege: data.preferredCollege,
            periodOfStudy: data.periodOfStudy,
            preferredIntake: data.preferredIntake,
            previousVisaApply: data.previousVisaApply,
          } as never
        : undefined,
      family: (data.fatherName || data.motherName)
        ? {
            fatherName: data.fatherName,
            fatherPhone: data.fatherPhone,
            motherName: data.motherName,
            motherPhone: data.motherPhone,
          } as never
        : undefined,
      source: data.source as never,
      sourceMetadata,
      preferredCounseling:
        data.preferredDate || data.preferredTime
          ? {
              date: data.preferredDate ? new Date(data.preferredDate) : undefined,
              time: data.preferredTime,
            }
          : undefined,
      notes: data.notes,
      createdBy: new Types.ObjectId(systemUserId),
    });

    return this.formatLead(created);
  }

  async getLeadStats(actor: ActorContext) {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchId = isOrgWide ? undefined : actor.branch ?? undefined;
    const counts = await leadRepository.countByStatus(branchId);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { total, byStatus: counts };
  }

  private enforceBranchAccess(lead: LeadDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const leadBranchId = String((lead.branch as unknown as BranchDocument)._id);
    if (leadBranchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this lead's branch");
    }
  }

  private formatLead(lead: LeadDocument): FormattedLead {
    const branch = lead.branch as unknown as BranchDocument;
    const counselor = lead.assignedCounselor as unknown as UserDocument | undefined;
    const creator = lead.createdBy as unknown as UserDocument;
    const program = lead.interestedProgram as unknown as
      | { _id: Types.ObjectId; code: string; name: string }
      | undefined;
    const visa = lead.interestedVisaCategory as unknown as
      | { _id: Types.ObjectId; code: string; name: string }
      | undefined;
    const student = lead.convertedToStudent as unknown as
      | {
          _id: Types.ObjectId;
          studentId: string;
          personal?: { firstName: string; lastName: string };
        }
      | undefined;

    return {
      id: String(lead._id),
      leadNumber: lead.leadNumber,
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      personal: lead.personal,
      address: lead.address,
      education: lead.education,
      preference: lead.preference,
      family: lead.family,
      source: lead.source,
      sourceMetadata: lead.sourceMetadata,
      interestedProgram: program
        ? { id: String(program._id), code: program.code, name: program.name }
        : null,
      interestedVisaCategory: visa
        ? { id: String(visa._id), code: visa.code, name: visa.name }
        : null,
      preferredCounseling: lead.preferredCounseling,
      assignedCounselor: counselor
        ? {
            id: String(counselor._id),
            email: counselor.email,
            firstName: counselor.profile.firstName,
            lastName: counselor.profile.lastName,
          }
        : null,
      status: lead.status,
      notes: lead.notes,
      convertedToStudent: student
        ? {
            id: String(student._id),
            studentId: student.studentId,
            firstName: student.personal?.firstName || '',
            lastName: student.personal?.lastName || '',
          }
        : null,
      convertedAt: lead.convertedAt,
      createdBy: {
        id: String(creator._id),
        email: creator.email,
        firstName: creator.profile.firstName,
        lastName: creator.profile.lastName,
      },
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }
}

export const leadService = new LeadService();