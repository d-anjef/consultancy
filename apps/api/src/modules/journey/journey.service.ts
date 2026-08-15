import { Types } from 'mongoose';
import { ORGANIZATION_WIDE_ROLE_CODES, type RoleCode } from '@consultancy/config';
import { journeyRepository } from './journey.repository.js';
import { studentRepository } from '../students/student.repository.js';
import { VisaCategoryModel } from '../visa-categories/visa-category.model.js';
import { applicationRepository } from '../applications/application.repository.js';
import type {
  MilestoneTemplateDocument,
  MilestoneTemplateItem,
} from './milestone-template.model.js';
import type {
  StudentJourneyDocument,
  StudentMilestoneItem,
  MilestoneStatus,
} from './student-milestone.model.js';
import type { StudentDocument } from '../students/student.model.js';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateJourneyForStudentDto,
  UpdateMilestoneStatusDto,
  UpdateMilestoneNotesDto,
} from './journey.validators.js';
import { extractId } from '../../lib/mongo.js';

export interface FormattedMilestoneTemplate {
  id: string;
  visaCategory: { id: string; code: string; name: string };
  name: string;
  description?: string;
  milestones: MilestoneTemplateItem[];
  milestoneCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormattedStudentJourney {
  id: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  application?: { id: string; applicationNumber: string; status: string } | null;
  visaCategory: { id: string; code: string; name: string };
  templateId?: string;
  milestones: FormattedMilestoneItem[];
  currentMilestone?: FormattedMilestoneItem | null;
  overallProgress: number;
  completedCount: number;
  totalRequired: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormattedMilestoneItem {
  key: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedDays?: number;
  status: MilestoneStatus;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class JourneyService {
  // ─── Templates ───────────────────────────────────

  async listTemplates(includeInactive = false): Promise<FormattedMilestoneTemplate[]> {
    const templates = await journeyRepository.listTemplates(includeInactive);
    return templates.map((t) => this.formatTemplate(t));
  }

  async getTemplateById(id: string): Promise<FormattedMilestoneTemplate> {
    const template = await journeyRepository.findTemplateById(id);
    if (!template) throw new NotFoundError('Milestone Template', id);
    return this.formatTemplate(template);
  }

  async createTemplate(
    data: CreateTemplateDto,
    actorId: string,
  ): Promise<FormattedMilestoneTemplate> {
    // Verify visa category
    const visa = await VisaCategoryModel.findById(data.visaCategoryId).lean();
    if (!visa) throw new NotFoundError('Visa Category', data.visaCategoryId);

    // Check no existing template
    const existing = await journeyRepository.findTemplateByVisaCategory(
      data.visaCategoryId,
    );
    if (existing) {
      throw new ConflictError(
        `A milestone template already exists for this visa category`,
      );
    }

    // Validate unique keys and orders
    this.validateMilestones(data.milestones);

    const created = await journeyRepository.createTemplate({
      visaCategory: new Types.ObjectId(data.visaCategoryId),
      name: data.name,
      description: data.description,
      milestones: data.milestones,
      createdBy: new Types.ObjectId(actorId),
    });

    return this.formatTemplate(created);
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateDto,
    actorId: string,
  ): Promise<FormattedMilestoneTemplate> {
    const existing = await journeyRepository.findTemplateById(id);
    if (!existing) throw new NotFoundError('Milestone Template', id);

    if (data.milestones) {
      this.validateMilestones(data.milestones);
    }

    const updated = await journeyRepository.updateTemplate(id, {
      name: data.name,
      description: data.description,
      milestones: data.milestones,
      isActive: data.isActive,
      updatedBy: new Types.ObjectId(actorId),
    });

    if (!updated) throw new NotFoundError('Milestone Template', id);
    return this.formatTemplate(updated);
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await journeyRepository.findTemplateById(id);
    if (!existing) throw new NotFoundError('Milestone Template', id);
    await journeyRepository.deleteTemplate(id);
  }

  // ─── Student Journeys ───────────────────────────

  async getJourneyByStudent(
    studentId: string,
    actor: ActorContext,
  ): Promise<FormattedStudentJourney | null> {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student', studentId);
    this.enforceStudentAccess(student, actor);

    const journey = await journeyRepository.findJourneyByStudent(studentId);
    return journey ? this.formatJourney(journey) : null;
  }

  async getOwnJourney(userId: string): Promise<FormattedStudentJourney | null> {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new NotFoundError('Student profile');

    const journey = await journeyRepository.findJourneyByStudent(String(student._id));
    return journey ? this.formatJourney(journey) : null;
  }

  async createJourneyForStudent(
    data: CreateJourneyForStudentDto,
    actor: ActorContext,
  ): Promise<FormattedStudentJourney> {
    const student = await studentRepository.findById(data.studentId);
    if (!student) throw new NotFoundError('Student', data.studentId);
    this.enforceStudentAccess(student, actor);

    // Check no existing journey
    const existing = await journeyRepository.findJourneyByStudent(data.studentId);
    if (existing) {
      throw new ConflictError('Student already has a journey');
    }

    // Determine visa category — from param, or from active application, or throw
    let visaCategoryId: string | undefined = data.visaCategoryId;
    let applicationId: Types.ObjectId | undefined = data.applicationId
      ? new Types.ObjectId(data.applicationId)
      : undefined;

    if (!visaCategoryId) {
      const activeApp = await applicationRepository.findActiveByStudent(data.studentId);
      if (!activeApp) {
        throw new BusinessRuleError(
          'Student has no active application. Provide visaCategoryId or create an application first.',
        );
      }
      visaCategoryId = String((activeApp.visaCategory as unknown as { _id: Types.ObjectId })._id);
      applicationId = activeApp._id as Types.ObjectId;
    }

    // Find template for this visa category
    const template = await journeyRepository.findTemplateByVisaCategory(visaCategoryId);
    if (!template) {
      throw new BusinessRuleError(
        'No milestone template found for this visa category. Please create one first.',
      );
    }

    // Create student milestones from template
    const milestones: StudentMilestoneItem[] = template.milestones.map((m) => ({
      key: m.key,
      title: m.title,
      description: m.description,
      order: m.order,
      isRequired: m.isRequired,
      estimatedDays: m.estimatedDays,
      status: 'NOT_STARTED' as const,
    }));

    const created = await journeyRepository.createJourney({
      student: student._id as Types.ObjectId,
      application: applicationId,
      visaCategory: new Types.ObjectId(visaCategoryId),
      templateId: template._id as Types.ObjectId,
      milestones,
      createdBy: new Types.ObjectId(actor.id),
    });

    return this.formatJourney(created);
  }

  async updateMilestoneStatus(
    journeyId: string,
    data: UpdateMilestoneStatusDto,
    actor: ActorContext,
  ): Promise<FormattedStudentJourney> {
    const journey = await journeyRepository.findJourneyById(journeyId);
    if (!journey) throw new NotFoundError('Journey', journeyId);

    const student = journey.student as unknown as StudentDocument;
    this.enforceStudentAccess(student, actor);

    const updated = await journeyRepository.updateMilestoneStatus(journeyId, {
      milestoneKey: data.milestoneKey,
      status: data.status as MilestoneStatus,
      notes: data.notes,
      completedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Journey', journeyId);
    return this.formatJourney(updated);
  }

  async updateMilestoneNotes(
    journeyId: string,
    data: UpdateMilestoneNotesDto,
    actor: ActorContext,
  ): Promise<FormattedStudentJourney> {
    const journey = await journeyRepository.findJourneyById(journeyId);
    if (!journey) throw new NotFoundError('Journey', journeyId);

    const student = journey.student as unknown as StudentDocument;
    this.enforceStudentAccess(student, actor);

    const updated = await journeyRepository.updateMilestoneNotes(
      journeyId,
      data.milestoneKey,
      data.notes,
      new Types.ObjectId(actor.id),
    );

    if (!updated) throw new NotFoundError('Journey', journeyId);
    return this.formatJourney(updated);
  }

  // ─── Helpers ───────────────────────────────────

  private validateMilestones(milestones: MilestoneTemplateItem[]): void {
    const keys = new Set<string>();
    for (const m of milestones) {
      if (keys.has(m.key)) {
        throw new BusinessRuleError(`Duplicate milestone key: ${m.key}`);
      }
      keys.add(m.key);
    }
  }

  private enforceStudentAccess(student: StudentDocument, actor: ActorContext): void {
    if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
    const studentBranchId = extractId(student.branch);
    // Handle populated branch
    const branchId =
      typeof student.branch === 'object' && student.branch !== null && '_id' in student.branch
        ? String((student.branch as { _id: Types.ObjectId })._id)
        : studentBranchId;
    if (branchId !== actor.branch) {
      throw new ForbiddenError("You do not have access to this student's branch");
    }
  }

  private formatTemplate(t: MilestoneTemplateDocument): FormattedMilestoneTemplate {
    const visa = t.visaCategory as unknown as {
      _id: Types.ObjectId;
      code: string;
      name: string;
    };

    return {
      id: String(t._id),
      visaCategory: { id: String(visa._id), code: visa.code, name: visa.name },
      name: t.name,
      description: t.description,
      milestones: t.milestones.sort((a, b) => a.order - b.order),
      milestoneCount: t.milestones.length,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private formatJourney(j: StudentJourneyDocument): FormattedStudentJourney {
    const student = j.student as unknown as StudentDocument;
    const visa = j.visaCategory as unknown as {
      _id: Types.ObjectId;
      code: string;
      name: string;
    };
    const app = j.application as unknown as
      | { _id: Types.ObjectId; applicationNumber: string; status: string }
      | undefined;

    const sortedMilestones = [...j.milestones].sort((a, b) => a.order - b.order);
    const currentMilestone = sortedMilestones.find(
      (m) => m.status !== 'COMPLETED' && m.status !== 'SKIPPED',
    );

    const requiredMilestones = j.milestones.filter((m) => m.isRequired);
    const completedRequired = requiredMilestones.filter((m) => m.status === 'COMPLETED');

    return {
      id: String(j._id),
      student: {
        id: String(student._id),
        studentId: student.studentId,
        firstName: student.personal.firstName,
        lastName: student.personal.lastName,
      },
      application: app
        ? {
            id: String(app._id),
            applicationNumber: app.applicationNumber,
            status: app.status,
          }
        : null,
      visaCategory: { id: String(visa._id), code: visa.code, name: visa.name },
      templateId: j.templateId ? String(j.templateId) : undefined,
      milestones: sortedMilestones.map((m) => this.formatMilestone(m)),
      currentMilestone: currentMilestone ? this.formatMilestone(currentMilestone) : null,
      overallProgress: j.overallProgress,
      completedCount: completedRequired.length,
      totalRequired: requiredMilestones.length,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    };
  }

  private formatMilestone(m: StudentMilestoneItem): FormattedMilestoneItem {
    return {
      key: m.key,
      title: m.title,
      description: m.description,
      order: m.order,
      isRequired: m.isRequired,
      estimatedDays: m.estimatedDays,
      status: m.status,
      startedAt: m.startedAt,
      completedAt: m.completedAt,
      notes: m.notes,
    };
  }
}

export const journeyService = new JourneyService();