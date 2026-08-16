import { Types } from 'mongoose';
import {
  ORGANIZATION_WIDE_ROLE_CODES,
  ROLE_CODES,
  STUDENT_STATUSES,
  LEAD_STATUSES,
  INVITATION_EXPIRY_MS,
  type RoleCode,
  type StudentStatus,
} from '@consultancy/config';
import { studentRepository } from './student.repository.js';
import { branchRepository } from '../branches/branch.repository.js';
import { userRepository } from '../users/user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { leadRepository } from '../leads/lead.repository.js';
import { LeadModel , LeadDocument} from '../leads/lead.model.js';
import type { StudentDocument } from './student.model.js';
import type { UserDocument } from '../users/user.model.js';
import type { BranchDocument } from '../branches/branch.model.js';

import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateStudentId } from '../../lib/studentId.js';
import { hashPassword, generateSecureToken } from '../../lib/crypto.js';
import { emailService } from '../auth/email.service.js';
import type {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateOwnStudentProfileDto,
  UpdateStudentStatusDto,
  TransferStudentBranchDto,
  ListStudentsQueryDto,
} from './student.validators.js';
import { extractId } from '../../lib/mongo.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedStudent {
  id: string;
  studentId: string;
  userId: string;
  userEmail: string;
  userStatus: string;
  branch: { id: string; code: string; name: string };
  originLead?: { id: string; leadNumber: string } | null;
  assignedCounselor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  personal: StudentDocument['personal'];
  contact: StudentDocument['contact'];
  emergencyContact: StudentDocument['emergencyContact'];
  passport?: StudentDocument['passport'];
  education?: StudentDocument['education'];
  currentApplication?: {
    id: string;
    applicationNumber: string;
    status: string;
  } | null;
  status: StudentStatus;
  admissionDate: Date;
  notes?: string;
  createdBy: { id: string; email: string; firstName: string; lastName: string };
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class StudentService {
  async listStudents(
    query: ListStudentsQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedStudent[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await studentRepository.list(
      {
        branchId: branchFilter,
        search: query.search,
        status: query.status as StudentStatus | undefined,
        assignedCounselorId: query.assignedCounselorId,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      },
      query.page,
      query.limit,
    );

    return {
      items: items.map((s) => this.formatStudent(s)),
      pagination,
    };
  }

  async getStudentById(id: string, actor: ActorContext): Promise<FormattedStudent> {
    const student = await studentRepository.findById(id);
    if (!student) throw new NotFoundError('Student', id);
    this.enforceBranchAccess(student, actor);
    return this.formatStudent(student);
  }

  async getOwnStudentProfile(userId: string): Promise<FormattedStudent> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new NotFoundError('Student profile');
    return this.formatStudent(student);
  }

  async createStudent(
    data: CreateStudentDto,
    actor: ActorContext,
  ): Promise<FormattedStudent> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);

    // Enforce branch scope
    if (!isOrgWide && actor.branch && data.branchId !== actor.branch) {
      throw new ForbiddenError('You can only create students for your assigned branch');
    }

    // Verify branch
    const branch = await branchRepository.findById(data.branchId);
    if (!branch) throw new NotFoundError('Branch', data.branchId);

    // Check email uniqueness
    const emailExists = await userRepository.existsByEmail(data.contact.email);
    if (emailExists) {
      throw new ConflictError(`A user with email "${data.contact.email}" already exists`);
    }

    // Check phone uniqueness in branch
    const existingByPhone = await studentRepository.findByPhone(
      data.contact.phone,
      data.branchId,
    );
    if (existingByPhone) {
      throw new ConflictError(
        `A student with phone ${data.contact.phone} already exists in this branch (${existingByPhone.studentId})`,
      );
    }

    // If from lead — validate
    let originLead: LeadDocument | null = null;
    if (data.fromLeadId) {
      originLead = await leadRepository.findById(data.fromLeadId);
      if (!originLead) throw new NotFoundError('Lead', data.fromLeadId);
      if (originLead.convertedToStudent) {
        throw new BusinessRuleError(
          `This lead has already been converted to a student`,
        );
      }
    }

    // Validate counselor
    let assignedCounselor: Types.ObjectId | undefined;
    if (data.assignedCounselorId) {
      const counselor = await userRepository.findById(data.assignedCounselorId);
      if (!counselor) throw new NotFoundError('Counselor', data.assignedCounselorId);
      assignedCounselor = counselor._id as Types.ObjectId;
    }

    // Create USER account for the student
    const studentRole = await roleRepository.findByCodeWithoutPopulate(ROLE_CODES.STUDENT);
    if (!studentRole) {
      throw new Error('STUDENT role not found in database');
    }

    const tempPassword = generateSecureToken(16);
    const passwordHash = await hashPassword(tempPassword);
    const invitationToken = generateSecureToken(32);
    const invitationExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

    const user = await userRepository.create({
      email: data.contact.email,
      passwordHash,
      role: studentRole._id as Types.ObjectId,
      branch: branch._id as Types.ObjectId,
      profile: {
        firstName: data.personal.firstName,
        lastName: data.personal.lastName,
        phone: data.contact.phone,
      },
      status: 'PENDING_ACTIVATION',
      emailVerified: false,
      invitedBy: new Types.ObjectId(actor.id),
      invitationToken,
      invitationExpiresAt,
      createdBy: new Types.ObjectId(actor.id),
      mustChangePassword: true,
    });

    // Generate student ID
    const studentIdValue = await generateStudentId();

    // Create student profile
    const student = await studentRepository.create({
      studentId: studentIdValue,
      userId: user._id as Types.ObjectId,
      branch: branch._id as Types.ObjectId,
      originLead: originLead ? (originLead._id as Types.ObjectId) : undefined,
      assignedCounselor,
      personal: {
        ...data.personal,
        dateOfBirth: new Date(data.personal.dateOfBirth),
      },
      contact: data.contact,
      emergencyContact: data.emergencyContact,
      passport: data.passport
        ? {
            ...data.passport,
            issueDate: data.passport.issueDate ? new Date(data.passport.issueDate) : undefined,
            expiryDate: data.passport.expiryDate ? new Date(data.passport.expiryDate) : undefined,
          }
        : undefined,
      education: data.education,
      notes: data.notes,
      createdBy: new Types.ObjectId(actor.id),
    });

    // Mark lead as converted
    if (originLead) {
      await LeadModel.findByIdAndUpdate(originLead._id, {
        $set: {
          status: LEAD_STATUSES.CONVERTED,
          convertedToStudent: student._id,
          convertedAt: new Date(),
          updatedBy: new Types.ObjectId(actor.id),
        },
      });
    }

    // Send invitation email
    if (data.sendInvitation !== false) {
      await emailService.sendInvitationEmail({
        to: data.contact.email,
        recipientName: `${data.personal.firstName} ${data.personal.lastName}`,
        invitationToken,
        roleName: 'Student',
      });
    }

    return this.formatStudent(student);
  }

  async updateStudent(
    id: string,
    data: UpdateStudentDto,
    actor: ActorContext,
  ): Promise<FormattedStudent> {
    const existing = await studentRepository.findById(id);
    if (!existing) throw new NotFoundError('Student', id);
    this.enforceBranchAccess(existing, actor);

    if (existing.status === STUDENT_STATUSES.ARCHIVED) {
      throw new BusinessRuleError('Cannot edit archived students');
    }

    const updated = await studentRepository.update(id, {
      personal: data.personal
        ? {
            ...data.personal,
            dateOfBirth: data.personal.dateOfBirth
              ? new Date(data.personal.dateOfBirth)
              : undefined,
          }
        : undefined,
      contact: data.contact,
      emergencyContact: data.emergencyContact,
      passport: data.passport
        ? {
            ...data.passport,
            issueDate: data.passport.issueDate ? new Date(data.passport.issueDate) : undefined,
            expiryDate: data.passport.expiryDate ? new Date(data.passport.expiryDate) : undefined,
          }
        : undefined,
      education: data.education,
      assignedCounselor: data.assignedCounselorId
        ? new Types.ObjectId(data.assignedCounselorId)
        : undefined,
      notes: data.notes,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Student', id);
    return this.formatStudent(updated);
  }

  /**
   * Student self-update — enforces STUDENT_EDITABLE_FIELDS rule.
   * Backend guarantees only allowed fields are updated.
   */
  async updateOwnStudentProfile(
    userId: string,
    data: UpdateOwnStudentProfileDto,
  ): Promise<FormattedStudent> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new NotFoundError('Student profile');

    // Only allow specific contact fields + emergency contact
    const updated = await studentRepository.update(String(student._id), {
      contact: data.contact
        ? {
            phone: data.contact.phone,
            email: data.contact.email,
            alternatePhone: data.contact.alternatePhone,
            address: data.contact.address as never,
          }
        : undefined,
      emergencyContact: data.emergencyContact,
      updatedBy: new Types.ObjectId(userId),
    });

    if (!updated) throw new NotFoundError('Student profile');
    return this.formatStudent(updated);
  }

  async updateStatus(
    id: string,
    data: UpdateStudentStatusDto,
    actor: ActorContext,
  ): Promise<FormattedStudent> {
    const existing = await studentRepository.findById(id);
    if (!existing) throw new NotFoundError('Student', id);
    this.enforceBranchAccess(existing, actor);

    const updated = await studentRepository.update(id, {
      status: data.status as StudentStatus,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Student', id);
    return this.formatStudent(updated);
  }

  async archiveStudent(id: string, actor: ActorContext): Promise<FormattedStudent> {
    return this.updateStatus(
      id,
      { status: STUDENT_STATUSES.ARCHIVED as never },
      actor,
    );
  }

  async transferBranch(
    id: string,
    data: TransferStudentBranchDto,
    actor: ActorContext,
  ): Promise<FormattedStudent> {
    const existing = await studentRepository.findById(id);
    if (!existing) throw new NotFoundError('Student', id);

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const currentBranchId = String((existing.branch as unknown as BranchDocument)._id);

    // Only org-wide or the current branch's manager can transfer OUT
    if (!isOrgWide && actor.branch !== currentBranchId) {
      throw new ForbiddenError('You can only transfer students from your branch');
    }

    const newBranch = await branchRepository.findById(data.branchId);
    if (!newBranch) throw new NotFoundError('Branch', data.branchId);

    if (String(newBranch._id) === currentBranchId) {
      throw new BusinessRuleError('Student is already in that branch');
    }

    let assignedCounselor: Types.ObjectId | undefined;
    if (data.assignedCounselorId) {
      const counselor = await userRepository.findById(data.assignedCounselorId);
      if (!counselor) throw new NotFoundError('Counselor', data.assignedCounselorId);
      const counselorBranchId = extractId(counselor.branch);
      if (counselorBranchId !== String(newBranch._id)) {
        throw new BusinessRuleError(
          'Counselor must belong to the destination branch',
        );
      }
      assignedCounselor = counselor._id as Types.ObjectId;
    }

    const updated = await studentRepository.update(id, {
      branch: newBranch._id as Types.ObjectId,
      assignedCounselor,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Student', id);
    return this.formatStudent(updated);
  }

  async getStudentStats(actor: ActorContext) {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchId = isOrgWide ? undefined : actor.branch ?? undefined;
    const counts = await studentRepository.countByStatus(branchId);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { total, byStatus: counts };
  }

  private enforceBranchAccess(student: StudentDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const branchId = String((student.branch as unknown as BranchDocument)._id);
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this student's branch");
    }
  }
  private formatStudent(s: StudentDocument): FormattedStudent {
  const branch = s.branch as unknown as BranchDocument | null;
  const user = s.userId as unknown as UserDocument | null;
  const counselor = s.assignedCounselor as unknown as UserDocument | null | undefined;
  const lead = s.originLead as unknown as
    | { _id: Types.ObjectId; leadNumber: string }
    | null
    | undefined;
  const app = s.currentApplication as unknown as
    | { _id: Types.ObjectId; applicationNumber: string; status: string }
    | null
    | undefined;
  const creator = s.createdBy as unknown as UserDocument | null;

  return {
    id: String(s._id),
    studentId: s.studentId,
    userId: user?._id ? String(user._id) : '',
    userEmail: user?.email ?? 'unknown@deleted.user',
    userStatus: user?.status ?? 'DELETED',
    branch: branch?._id
      ? {
          id: String(branch._id),
          code: branch.code,
          name: branch.name,
        }
      : { id: '', code: 'N/A', name: 'Unknown Branch' },
    originLead: lead?._id
      ? { id: String(lead._id), leadNumber: lead.leadNumber }
      : null,
    assignedCounselor: counselor?._id
      ? {
          id: String(counselor._id),
          email: counselor.email,
          firstName: counselor.profile?.firstName ?? '',
          lastName: counselor.profile?.lastName ?? '',
        }
      : null,
    personal: s.personal,
    contact: s.contact,
    emergencyContact: s.emergencyContact,
    passport: s.passport,
    education: s.education,
    currentApplication: app?._id
      ? {
          id: String(app._id),
          applicationNumber: app.applicationNumber,
          status: app.status,
        }
      : null,
    status: s.status,
    admissionDate: s.admissionDate,
    notes: s.notes,
    createdBy: creator?._id
      ? {
          id: String(creator._id),
          email: creator.email,
          firstName: creator.profile?.firstName ?? '',
          lastName: creator.profile?.lastName ?? '',
        }
      : { id: '', email: 'deleted', firstName: 'Deleted', lastName: 'User' },
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
}

export const studentService = new StudentService();