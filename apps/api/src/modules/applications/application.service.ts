import { Types } from 'mongoose';
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_TRANSITIONS,
  ORGANIZATION_WIDE_ROLE_CODES,
  type ApplicationStatus,
  type RoleCode,
} from '@consultancy/config';
import { applicationRepository } from './application.repository.js';
import { studentRepository } from '../students/student.repository.js';
import { userRepository } from '../users/user.repository.js';
import { StudentModel } from '../students/student.model.js';
import { ProgramModel } from '../programs/program.model.js';
import { VisaCategoryModel } from '../visa-categories/visa-category.model.js';
import type { ApplicationDocument } from './application.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import {
  BusinessRuleError,
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateApplicationNumber } from '../../lib/studentId.js';
import type {
  CreateApplicationDto,
  UpdateApplicationDto,
  ChangeApplicationStatusDto,
  CancelApplicationDto,
  ListApplicationsQueryDto,
} from './application.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedApplication {
  id: string;
  applicationNumber: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  branch: { id: string; code: string; name: string };
  visaCategory: { id: string; code: string; name: string };
  program: { id: string; code: string; name: string; type: string };
  schoolOrCompany: ApplicationDocument['schoolOrCompany'];
  intake: ApplicationDocument['intake'];
  assignedCounselor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  status: ApplicationStatus;
  deadlines?: ApplicationDocument['deadlines'];
  notes?: string;
  isActive: boolean;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class ApplicationService {
  async list(
    query: ListApplicationsQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedApplication[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await applicationRepository.list(
      {
        branchId: branchFilter,
        studentId: query.studentId,
        status: query.status as ApplicationStatus | undefined,
        visaCategoryId: query.visaCategoryId,
        programId: query.programId,
        assignedCounselorId: query.assignedCounselorId,
        intakeYear: query.intakeYear,
        isActive: query.isActive,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((a) => this.format(a)), pagination };
  }

  async getById(id: string, actor: ActorContext): Promise<FormattedApplication> {
    const app = await applicationRepository.findById(id);
    if (!app) throw new NotFoundError('Application', id);
    this.enforceBranchAccess(app, actor);
    return this.format(app);
  }

  async create(data: CreateApplicationDto, actor: ActorContext): Promise<FormattedApplication> {
    const student = await studentRepository.findById(data.studentId);
    if (!student) throw new NotFoundError('Student', data.studentId);

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const studentBranchId = String((student.branch as unknown as BranchDocument)._id);
    if (!isOrgWide && studentBranchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this student's branch");
    }

    // Check no active application exists
    const existingActive = await applicationRepository.findActiveByStudent(data.studentId);
    if (existingActive) {
      throw new BusinessRuleError(
        `Student already has an active application (${existingActive.applicationNumber})`,
      );
    }

    // Validate references
    const program = await ProgramModel.findById(data.programId).lean();
    if (!program || !program.isActive) throw new NotFoundError('Program', data.programId);

    const visa = await VisaCategoryModel.findById(data.visaCategoryId).lean();
    if (!visa || !visa.isActive) throw new NotFoundError('Visa Category', data.visaCategoryId);

    const counselor = await userRepository.findById(data.assignedCounselorId);
    if (!counselor) throw new NotFoundError('Counselor', data.assignedCounselorId);
    if (counselor.branch && String(counselor.branch) !== studentBranchId) {
      throw new BusinessRuleError("Counselor must be from the student's branch");
    }

    const applicationNumber = await generateApplicationNumber();

    const created = await applicationRepository.create({
      applicationNumber,
      student: student._id as Types.ObjectId,
      branch: (student.branch as unknown as BranchDocument)._id as Types.ObjectId,
      visaCategory: new Types.ObjectId(data.visaCategoryId),
      program: new Types.ObjectId(data.programId),
      schoolOrCompany: data.schoolOrCompany,
      intake: data.intake,
      assignedCounselor: counselor._id as Types.ObjectId,
      notes: data.notes,
      createdBy: new Types.ObjectId(actor.id),
    });

    // Record initial status
    await applicationRepository.recordStatusChange(
      created._id as Types.ObjectId,
      undefined,
      created.status,
      new Types.ObjectId(actor.id),
    );

    // Update student's currentApplication
    await StudentModel.findByIdAndUpdate(student._id, {
      $set: { currentApplication: created._id },
    });

    return this.format(created);
  }

  async update(id: string, data: UpdateApplicationDto, actor: ActorContext): Promise<FormattedApplication> {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new NotFoundError('Application', id);
    this.enforceBranchAccess(existing, actor);

    if ([APPLICATION_STATUSES.APPROVED, APPLICATION_STATUSES.REJECTED, APPLICATION_STATUSES.COMPLETED, APPLICATION_STATUSES.CANCELLED].includes(existing.status as never)) {
      throw new BusinessRuleError(`Cannot edit application in status: ${existing.status}`);
    }

    let assignedCounselor: Types.ObjectId | undefined;
    if (data.assignedCounselorId) {
      const c = await userRepository.findById(data.assignedCounselorId);
      if (!c) throw new NotFoundError('Counselor', data.assignedCounselorId);
      assignedCounselor = c._id as Types.ObjectId;
    }

    const updated = await applicationRepository.update(id, {
      schoolOrCompany: data.schoolOrCompany,
      intake: data.intake,
      deadlines: data.deadlines
        ? {
            documentSubmission: data.deadlines.documentSubmission
              ? new Date(data.deadlines.documentSubmission)
              : undefined,
            applicationSubmission: data.deadlines.applicationSubmission
              ? new Date(data.deadlines.applicationSubmission)
              : undefined,
            result: data.deadlines.result ? new Date(data.deadlines.result) : undefined,
          }
        : undefined,
      assignedCounselor,
      notes: data.notes,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Application', id);
    return this.format(updated);
  }

  async changeStatus(
    id: string,
    data: ChangeApplicationStatusDto,
    actor: ActorContext,
  ): Promise<FormattedApplication> {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new NotFoundError('Application', id);
    this.enforceBranchAccess(existing, actor);

    const currentStatus = existing.status;
    const newStatus = data.status as ApplicationStatus;

    if (currentStatus === newStatus) return this.format(existing);

    const allowed = APPLICATION_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidStateTransitionError('Application', currentStatus, newStatus);
    }

    const additional: Partial<ApplicationDocument> = {};
    const now = new Date();

    if (newStatus === APPLICATION_STATUSES.SUBMITTED) additional.submittedAt = now;
    if (newStatus === APPLICATION_STATUSES.APPROVED) additional.approvedAt = now;
    if (newStatus === APPLICATION_STATUSES.REJECTED) {
      additional.rejectedAt = now;
      additional.rejectionReason = data.reason;
      additional.isActive = false;
    }
    if (newStatus === APPLICATION_STATUSES.COMPLETED) {
      additional.completedAt = now;
      additional.isActive = false;
    }

    const updated = await applicationRepository.updateStatus(
      id,
      newStatus,
      additional,
      new Types.ObjectId(actor.id),
    );

    if (!updated) throw new NotFoundError('Application', id);

    await applicationRepository.recordStatusChange(
      updated._id as Types.ObjectId,
      currentStatus,
      newStatus,
      new Types.ObjectId(actor.id),
      data.reason,
    );

    // Clear student's currentApplication if terminal
    if (!updated.isActive) {
      await StudentModel.findByIdAndUpdate(updated.student, {
        $unset: { currentApplication: '' },
      });
    }

    return this.format(updated);
  }

  async cancel(
    id: string,
    data: CancelApplicationDto,
    actor: ActorContext,
  ): Promise<FormattedApplication> {
    const existing = await applicationRepository.findById(id);
    if (!existing) throw new NotFoundError('Application', id);
    this.enforceBranchAccess(existing, actor);

    const allowed = APPLICATION_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(APPLICATION_STATUSES.CANCELLED)) {
      throw new InvalidStateTransitionError('Application', existing.status, 'CANCELLED');
    }

    const updated = await applicationRepository.updateStatus(
      id,
      APPLICATION_STATUSES.CANCELLED,
      {
        cancelledAt: new Date(),
        cancellationReason: data.reason,
        isActive: false,
      },
      new Types.ObjectId(actor.id),
    );

    if (!updated) throw new NotFoundError('Application', id);

    await applicationRepository.recordStatusChange(
      updated._id as Types.ObjectId,
      existing.status,
      APPLICATION_STATUSES.CANCELLED,
      new Types.ObjectId(actor.id),
      data.reason,
    );

    await StudentModel.findByIdAndUpdate(updated.student, {
      $unset: { currentApplication: '' },
    });

    return this.format(updated);
  }

  async getStatusHistory(id: string, actor: ActorContext) {
    const app = await applicationRepository.findById(id);
    if (!app) throw new NotFoundError('Application', id);
    this.enforceBranchAccess(app, actor);

    const history = await applicationRepository.getStatusHistory(id);
    return history.map((h) => {
      const user = h.changedBy as unknown as {
        _id: Types.ObjectId;
        email?: string;
        profile?: { firstName?: string; lastName?: string };
      };
      return {
        id: String(h._id),
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedBy: {
          id: String(user._id),
          email: user.email,
          name:
            user.profile?.firstName && user.profile?.lastName
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : undefined,
        },
        changedAt: h.changedAt,
        reason: h.reason,
      };
    });
  }

  private enforceBranchAccess(app: ApplicationDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branchId = String((app.branch as unknown as BranchDocument)._id);
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this application's branch");
    }
  }

  private format(a: ApplicationDocument): FormattedApplication {
    const student = a.student as unknown as {
      _id: Types.ObjectId;
      studentId: string;
      personal: { firstName: string; lastName: string };
      contact: { phone: string; email: string };
    };
    const branch = a.branch as unknown as BranchDocument;
    const visa = a.visaCategory as unknown as {
      _id: Types.ObjectId;
      code: string;
      name: string;
    };
    const program = a.program as unknown as {
      _id: Types.ObjectId;
      code: string;
      name: string;
      type: string;
    };
    const counselor = a.assignedCounselor as unknown as {
      _id: Types.ObjectId;
      email: string;
      profile: { firstName: string; lastName: string };
    };

    return {
      id: String(a._id),
      applicationNumber: a.applicationNumber,
      student: {
        id: String(student._id),
        studentId: student.studentId,
        firstName: student.personal.firstName,
        lastName: student.personal.lastName,
        phone: student.contact.phone,
        email: student.contact.email,
      },
      branch: { id: String(branch._id), code: branch.code, name: branch.name },
      visaCategory: { id: String(visa._id), code: visa.code, name: visa.name },
      program: {
        id: String(program._id),
        code: program.code,
        name: program.name,
        type: program.type,
      },
      schoolOrCompany: a.schoolOrCompany,
      intake: a.intake,
      assignedCounselor: {
        id: String(counselor._id),
        email: counselor.email,
        firstName: counselor.profile.firstName,
        lastName: counselor.profile.lastName,
      },
      status: a.status,
      deadlines: a.deadlines,
      notes: a.notes,
      isActive: a.isActive,
      submittedAt: a.submittedAt,
      approvedAt: a.approvedAt,
      rejectedAt: a.rejectedAt,
      rejectionReason: a.rejectionReason,
      completedAt: a.completedAt,
      cancelledAt: a.cancelledAt,
      cancellationReason: a.cancellationReason,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}

export const applicationService = new ApplicationService();