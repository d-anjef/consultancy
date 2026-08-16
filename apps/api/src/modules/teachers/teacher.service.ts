import { Types } from 'mongoose';
import {
  ORGANIZATION_WIDE_ROLE_CODES,
  ROLE_CODES,
  type RoleCode,
} from '@consultancy/config';
import { teacherRepository } from './teacher.repository.js';
import { userRepository } from '../users/user.repository.js';
import type { TeacherProfileDocument, EmploymentType } from './teacher.model.js';
import type { UserDocument } from '../users/user.model.js';
import type { BranchDocument } from '../branches/branch.model.js';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js';
import { extractId } from '../../lib/mongo.js';
import { generateTeacherId } from '../../lib/studentId.js';
import type {
  CreateTeacherProfileDto,
  UpdateTeacherProfileDto,
  ListTeachersQueryDto,
} from './teacher.validators.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedTeacher {
  id: string;
  employeeId: string;
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    profilePhotoUrl?: string;
    status: string;
  };
  branch: { id: string; code: string; name: string };
  qualification?: string;
  specialization: string[];
  experienceYears?: number;
  employmentType: EmploymentType;
  joinedDate: Date;
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ActorContext {
  id: string;
  role: RoleCode;
  branch: string | null;
}

export class TeacherService {
  async listTeachers(
    query: ListTeachersQueryDto,
    actor: ActorContext,
  ): Promise<{ items: FormattedTeacher[]; pagination: PaginationMeta }> {
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    const branchFilter = isOrgWide ? query.branchId : actor.branch ?? undefined;

    const { items, pagination } = await teacherRepository.list(
      {
        branchId: branchFilter,
        search: query.search,
        isActive: query.isActive,
      },
      query.page,
      query.limit,
    );

    return { items: items.map((t) => this.format(t)), pagination };
  }

  async getById(id: string, actor: ActorContext): Promise<FormattedTeacher> {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) throw new NotFoundError('Teacher', id);
    this.enforceBranchAccess(teacher, actor);
    return this.format(teacher);
  }

  async getMyProfile(userId: string): Promise<FormattedTeacher> {
    const teacher = await teacherRepository.findByUserId(userId);
    if (!teacher) throw new NotFoundError('Teacher profile');
    return this.format(teacher);
  }

  async createProfile(
    data: CreateTeacherProfileDto,
    actor: ActorContext,
  ): Promise<FormattedTeacher> {
    // Verify user exists and has TEACHER role
    const user = await userRepository.findById(data.userId);
    if (!user) throw new NotFoundError('User', data.userId);

    const userRole = user.role as unknown as { code: string };
    if (userRole.code !== ROLE_CODES.TEACHER) {
      throw new BusinessRuleError(
        'User must have TEACHER role to create teacher profile',
      );
    }

    if (!user.branch) {
      throw new BusinessRuleError('User must have a branch assigned');
    }

    // Check no existing profile
    const existing = await teacherRepository.findByUserId(data.userId);
    if (existing) {
      throw new ConflictError('Teacher profile already exists for this user');
    }

    // Enforce branch access
    const isOrgWide = ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role);
    if (!isOrgWide && extractId(user.branch) !== actor.branch) {
      throw new ForbiddenError('You can only create teacher profiles in your branch');
    }

    const employeeId = await generateTeacherId();

    const created = await teacherRepository.create({
      userId: user._id as Types.ObjectId,
      branch: user.branch as Types.ObjectId,
      employeeId,
      qualification: data.qualification,
      specialization: data.specialization,
      experienceYears: data.experienceYears,
      employmentType: data.employmentType as EmploymentType,
      joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
      bio: data.bio,
      createdBy: new Types.ObjectId(actor.id),
    });

    return this.format(created);
  }

  async updateProfile(
    id: string,
    data: UpdateTeacherProfileDto,
    actor: ActorContext,
  ): Promise<FormattedTeacher> {
    const existing = await teacherRepository.findById(id);
    if (!existing) throw new NotFoundError('Teacher', id);
    this.enforceBranchAccess(existing, actor);

    const updated = await teacherRepository.update(id, {
      qualification: data.qualification,
      specialization: data.specialization,
      experienceYears: data.experienceYears,
      employmentType: data.employmentType as EmploymentType,
      bio: data.bio,
      isActive: data.isActive,
      updatedBy: new Types.ObjectId(actor.id),
    });

    if (!updated) throw new NotFoundError('Teacher', id);
    return this.format(updated);
  }

  private enforceBranchAccess(teacher: TeacherProfileDocument, actor: ActorContext): void {
  if (ORGANIZATION_WIDE_ROLE_CODES.includes(actor.role)) return;
  const branch = teacher.branch as unknown as BranchDocument | null;
  const branchId = branch?._id ? String(branch._id) : null;
  if (branchId !== actor.branch) {
    throw new ForbiddenError("You do not have access to this teacher's branch");
  }
}

  private format(t: TeacherProfileDocument): FormattedTeacher {
  const user = t.userId as unknown as UserDocument | null;
  const branch = t.branch as unknown as BranchDocument | null;

  return {
    id: String(t._id),
    employeeId: t.employeeId,
    userId: user?._id ? String(user._id) : '',
    user: user?._id
      ? {
          email: user.email,
          firstName: user.profile?.firstName ?? '',
          lastName: user.profile?.lastName ?? '',
          phone: user.profile?.phone ?? '',
          profilePhotoUrl: user.profile?.profilePhotoUrl,
          status: user.status,
        }
      : {
          email: 'deleted@user',
          firstName: 'Deleted',
          lastName: 'User',
          phone: '',
          profilePhotoUrl: undefined,
          status: 'DELETED',
        },
    branch: branch?._id
      ? { id: String(branch._id), code: branch.code, name: branch.name }
      : { id: '', code: 'N/A', name: 'Unknown Branch' },
    qualification: t.qualification,
    specialization: t.specialization ?? [],
    experienceYears: t.experienceYears,
    employmentType: t.employmentType,
    joinedDate: t.joinedDate,
    bio: t.bio,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
}

export const teacherService = new TeacherService();