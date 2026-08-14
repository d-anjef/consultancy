import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type StudentStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SUSPENDED'
  | 'WITHDRAWN'
  | 'ARCHIVED';

export interface StudentAddress {
  street: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode?: string;
}

export interface Student {
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
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    nationality: string;
    maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
    fatherName?: string;
    motherName?: string;
  };
  contact: {
    phone: string;
    email: string;
    alternatePhone?: string;
    address: StudentAddress;
    permanentAddress?: StudentAddress;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  };
  passport?: {
    number?: string;
    issueDate?: string;
    expiryDate?: string;
    issuePlace?: string;
  };
  education?: {
    highestQualification?: string;
    institution?: string;
    completionYear?: number;
    percentage?: number;
  };
  currentApplication?: {
    id: string;
    applicationNumber: string;
    status: string;
  } | null;
  status: StudentStatus;
  admissionDate: string;
  notes?: string;
  createdBy: { id: string; email: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;

      referredBy?: {
      id: string;
      studentId: string;
      firstName: string;
      lastName: string;
      status: string;
    } | null;
    referralRelationship?: string;
}

export interface StudentStats {
  total: number;
  byStatus: Record<string, number>;
}

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StudentStatus;
  branchId?: string;
  assignedCounselorId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateStudentInput {
  branchId: string;
  fromLeadId?: string;
  assignedCounselorId?: string;
  personal: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    nationality?: string;
    maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
    fatherName?: string;
    motherName?: string;
  };
  contact: {
    phone: string;
    email: string;
    alternatePhone?: string;
    address: StudentAddress;
    permanentAddress?: StudentAddress;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  };
  passport?: {
    number?: string;
    issueDate?: string;
    expiryDate?: string;
    issuePlace?: string;
  };
  education?: {
    highestQualification?: string;
    institution?: string;
    completionYear?: number;
    percentage?: number;
  };
  notes?: string;
  referredBy?: string;
  referralRelationship?: string;
  sendInvitation?: boolean;
}

export interface UpdateStudentInput {
  personal?: Partial<CreateStudentInput['personal']>;
  contact?: Partial<CreateStudentInput['contact']>;
  emergencyContact?: Partial<CreateStudentInput['emergencyContact']>;
  passport?: CreateStudentInput['passport'];
  education?: CreateStudentInput['education'];
  assignedCounselorId?: string;
  notes?: string;
}

export interface TransferStudentBranchInput {
  branchId: string;
  assignedCounselorId?: string;
  reason: string;
}

export const studentsApi = {
  list: async (
    params: ListStudentsParams = {},
  ): Promise<{ items: Student[]; pagination: PaginationMeta }> => {
    const items = await api.get<Student[]>('/students', params as Record<string, unknown>);
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  stats: (): Promise<StudentStats> => api.get<StudentStats>('/students/stats'),

  getById: (id: string): Promise<Student> => api.get<Student>(`/students/${id}`),

  getMe: (): Promise<Student> => api.get<Student>('/students/me'),

  create: (input: CreateStudentInput): Promise<Student> =>
    api.post<Student>('/students', input),

  update: (id: string, input: UpdateStudentInput): Promise<Student> =>
    api.patch<Student>(`/students/${id}`, input),

  updateMe: (input: UpdateStudentInput): Promise<Student> =>
    api.patch<Student>('/students/me', input),

  archive: (id: string): Promise<Student> =>
    api.post<Student>(`/students/${id}/archive`),

  transfer: (id: string, input: TransferStudentBranchInput): Promise<Student> =>
    api.post<Student>(`/students/${id}/transfer`, input),
};