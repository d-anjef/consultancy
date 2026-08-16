import { Types } from 'mongoose';
import {
  ORGANIZATION_WIDE_ROLE_CODES,
  ROLE_CODES,
  type RoleCode,
  type ClassStatus,
} from '@consultancy/config';
import { classRepository } from './class.repository.js';
import { teacherRepository } from '../teachers/teacher.repository.js';
import { branchRepository } from '../branches/branch.repository.js';
import { studentRepository } from '../students/student.repository.js';
import type { ClassDocument } from './class.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import type { TeacherProfileDocument } from '../teachers/teacher.model.js';
import type { UserDocument } from '../users/user.model.js';
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import { generateClassCode } from '../../lib/studentId.js';
import type {
  CreateClassDto,
  UpdateClassDto,
  EnrollStudentsDto,
  ListClassesQueryDto,
} from './class.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedClass {
  id: string;
  classCode: string;
  name: string;
  branch: { id: string; code: string; name: string };
  program?: { id: string; code: string; name: string; type: string } | null;
  languageLevel?: { id: string; code: string; name: string; examType: string } | null;
  teacher: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  students: Array<{ id: string; studentId: string; firstName: string; lastName: string }>;
  studentsCount: number;
  schedule: ClassDocument['schedule'];
  startDate: Date;
  endDate?: Date;
  status: ClassStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class ClassService {
  async list(
    query: ListClassesQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedClass[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    // If actor is teacher, filter by their teacher profile
    let teacherFilter = query.teacherId;
    if (actor.role === ROLE_CODES.TEACHER) {
      const teacherProfile = await teacherRepository.findByUserId(actor.id);
      teacherFilter = teacherProfile ? String(teacherProfile._id) : undefined;
    }

    const { items, pagination } = await classRepository.list(
      {
        branchId: branchFilter,
        teacherId: teacherFilter,
        studentId: query.studentId,
        languageLevelId: query.languageLevelId,
        status: query.status as ClassStatus | undefined,
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((c) => this.format(c)), pagination };
  }

  async getById(id: string, actor: ActorContext): Promise<FormattedClass> {
    const cls = await classRepository.findById(id);
    if (!cls) throw new NotFoundError('Class', id);
    this.enforceBranchAccess(cls, actor);
    return this.format(cls);
  }

  async getMyClasses(userId: string, roleCode: RoleCode): Promise<FormattedClass[]> {
    if (roleCode === ROLE_CODES.TEACHER) {
      const teacher = await teacherRepository.findByUserId(userId);
      if (!teacher) return [];
      const classes = await classRepository.findByTeacher(String(teacher._id));
      return classes.map((c) => this.format(c));
    }
    if (roleCode === ROLE_CODES.STUDENT) {
      const student = await studentRepository.findByUserId(userId);
      if (!student) return [];
      const classes = await classRepository.findByStudent(String(student._id));
      return classes.map((c) => this.format(c));
    }
    return [];
  }

  async create(data: CreateClassDto, actor: ActorContext): Promise<FormattedClass> {
    const branch = await branchRepository.findById(data.branchId);
    if (!branch) throw new NotFoundError('Branch', data.branchId);

    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    if (!isOrgWide && String(branch._id) !== actor.branch) {
      throw new ForbiddenError('You can only create classes in your branch');
    }

    const teacher = await teacherRepository.findById(data.teacherId);
    if (!teacher) throw new NotFoundError('Teacher', data.teacherId);

    // Teacher must be in the same branch
    const teacherBranchId = String((teacher.branch as unknown as BranchDocument)._id);
    if (teacherBranchId !== String(branch._id)) {
      throw new BusinessRuleError('Teacher must be from the same branch as the class');
    }

    // Validate time range
    if (data.schedule.startTime >= data.schedule.endTime) {
      throw new BusinessRuleError('End time must be after start time');
    }

    const classCode = await generateClassCode();

    const created = await classRepository.create({
      classCode,
      name: data.name,
      branch: branch._id as Types.ObjectId,
      program: data.programId ? new Types.ObjectId(data.programId) : undefined,
      languageLevel: data.languageLevelId ? new Types.ObjectId(data.languageLevelId) : undefined,
      teacher: teacher._id as Types.ObjectId,
      schedule: data.schedule,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes,
      createdBy: new Types.ObjectId(actor.id),
    });

    return this.format(created);
  }

  async update(id: string, data: UpdateClassDto, actor: ActorContext): Promise<FormattedClass> {
    const existing = await classRepository.findById(id);
    if (!existing) throw new NotFoundError('Class', id);
    this.enforceBranchAccess(existing, actor);

    // If changing teacher, verify same branch
    if (data.teacherId) {
      const teacher = await teacherRepository.findById(data.teacherId);
      if (!teacher) throw new NotFoundError('Teacher', data.teacherId);
      const teacherBranchId = String((teacher.branch as unknown as BranchDocument)._id);
      const classBranchId = String((existing.branch as unknown as BranchDocument)._id);
      if (teacherBranchId !== classBranchId) {
        throw new BusinessRuleError('Teacher must be from the same branch as the class');
      }
    }

    if (data.schedule?.startTime && data.schedule?.endTime) {
      if (data.schedule.startTime >= data.schedule.endTime) {
        throw new BusinessRuleError('End time must be after start time');
      }
    }

    const updated = await classRepository.update(id, {
      name: data.name,
      program: data.programId === null ? null : data.programId ? new Types.ObjectId(data.programId) : undefined,
      languageLevel: data.languageLevelId === null ? null : data.languageLevelId ? new Types.ObjectId(data.languageLevelId) : undefined,
      teacher: data.teacherId ? new Types.ObjectId(data.teacherId) : undefined,
      schedule: data.schedule,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status as ClassStatus | undefined,
      notes: data.notes,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Class', id);
    return this.format(updated);
  }

  async enrollStudents(
    id: string,
    data: EnrollStudentsDto,
    actor: ActorContext,
  ): Promise<FormattedClass> {
    const cls = await classRepository.findById(id);
    if (!cls) throw new NotFoundError('Class', id);
    this.enforceBranchAccess(cls, actor);

    // Verify all students exist and are in same branch
    const classBranchId = String((cls.branch as unknown as BranchDocument)._id);
    for (const studentId of data.studentIds) {
      const student = await studentRepository.findById(studentId);
      if (!student) throw new NotFoundError('Student', studentId);
      const studentBranchId = String((student.branch as unknown as BranchDocument)._id);
      if (studentBranchId !== classBranchId) {
        throw new BusinessRuleError(`Student ${student.studentId} is not in the same branch as this class`);
      }
    }

    const objectIds = data.studentIds.map((id) => new Types.ObjectId(id));
    const updated = await classRepository.enrollStudents(id, objectIds);
    if (!updated) throw new NotFoundError('Class', id);
    return this.format(updated);
  }

  async unenrollStudents(
    id: string,
    data: EnrollStudentsDto,
    actor: ActorContext,
  ): Promise<FormattedClass> {
    const cls = await classRepository.findById(id);
    if (!cls) throw new NotFoundError('Class', id);
    this.enforceBranchAccess(cls, actor);

    const objectIds = data.studentIds.map((id) => new Types.ObjectId(id));
    const updated = await classRepository.unenrollStudents(id, objectIds);
    if (!updated) throw new NotFoundError('Class', id);
    return this.format(updated);
  }

  private enforceBranchAccess(cls: ClassDocument, actor: ActorContext): void {
  if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
  const branch = cls.branch as unknown as BranchDocument | null;
  const branchId = branch?._id ? String(branch._id) : null;
  if (branchId !== actor.branch) {
    throw new ForbiddenError("You do not have access to this class's branch");
  }
}

  private format(c: ClassDocument): FormattedClass {
  const branch = c.branch as unknown as BranchDocument | null;
  const program = c.program as unknown as
    | { _id: Types.ObjectId; code: string; name: string; type: string }
    | null
    | undefined;
  const level = c.languageLevel as unknown as
    | { _id: Types.ObjectId; code: string; name: string; examType: string }
    | null
    | undefined;
  const teacher = c.teacher as unknown as
    | (TeacherProfileDocument & { userId: UserDocument | null })
    | null;
  const students = (c.students as unknown as Array<{
    _id: Types.ObjectId;
    studentId: string;
    personal?: { firstName?: string; lastName?: string };
  } | null>) ?? [];

  // Filter out null students (deleted references)
  const validStudents = students.filter((s): s is NonNullable<typeof s> => !!s?._id);

  return {
    id: String(c._id),
    classCode: c.classCode,
    name: c.name,
    branch: branch?._id
      ? { id: String(branch._id), code: branch.code, name: branch.name }
      : { id: '', code: 'N/A', name: 'Unknown Branch' },
    program: program?._id
      ? {
          id: String(program._id),
          code: program.code,
          name: program.name,
          type: program.type,
        }
      : null,
    languageLevel: level?._id
      ? {
          id: String(level._id),
          code: level.code,
          name: level.name,
          examType: level.examType,
        }
      : null,
    teacher: teacher?._id
      ? {
          id: String(teacher._id),
          employeeId: teacher.employeeId ?? '',
          firstName: teacher.userId?.profile?.firstName ?? '',
          lastName: teacher.userId?.profile?.lastName ?? '',
          email: teacher.userId?.email ?? '',
        }
      : {
          id: '',
          employeeId: 'N/A',
          firstName: 'Unassigned',
          lastName: '',
          email: '',
        },
    students: validStudents.map((s) => ({
      id: String(s._id),
      studentId: s.studentId ?? '',
      firstName: s.personal?.firstName ?? '',
      lastName: s.personal?.lastName ?? '',
    })),
    studentsCount: validStudents.length,
    schedule: c.schedule,
    startDate: c.startDate,
    endDate: c.endDate,
    status: c.status,
    notes: c.notes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
}

export const classService = new ClassService();