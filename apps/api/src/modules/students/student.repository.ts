import { Types, type FilterQuery } from 'mongoose';
import { StudentModel, type StudentDocument } from './student.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import type { StudentStatus } from '@consultancy/config';

export interface CreateStudentData {
  studentId: string;
  userId: Types.ObjectId;
  branch: Types.ObjectId;
  originLead?: Types.ObjectId;
  assignedCounselor?: Types.ObjectId;
  personal: StudentDocument['personal'];
  contact: StudentDocument['contact'];
  emergencyContact: StudentDocument['emergencyContact'];
  passport?: StudentDocument['passport'];
  education?: StudentDocument['education'];
  notes?: string;
  createdBy: Types.ObjectId;
  referredBy?: Types.ObjectId;              
  referralRelationship?: string;             
}

export interface UpdateStudentData {
  personal?: Partial<StudentDocument['personal']>;
  contact?: Partial<StudentDocument['contact']>;
  emergencyContact?: Partial<StudentDocument['emergencyContact']>;
  passport?: Partial<StudentDocument['passport']>;
  education?: Partial<StudentDocument['education']>;
  assignedCounselor?: Types.ObjectId;
  branch?: Types.ObjectId;
  status?: StudentStatus;
  notes?: string;
  updatedBy: Types.ObjectId;
  referredBy?: Types.ObjectId | null;        
  referralRelationship?: string;              
}

export interface ListStudentsFilter {
  branchId?: string;
  search?: string;
  status?: StudentStatus;
  assignedCounselorId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ListStudentsResult {
  items: StudentDocument[];
  pagination: PaginationMeta;
}

const STUDENT_POPULATE = [
  { path: 'branch', select: 'code name' },
  {
    path: 'userId',
    select: 'email status',
  },
  {
    path: 'assignedCounselor',
    select: 'email profile.firstName profile.lastName',
  },
  { path: 'originLead', select: 'leadNumber' },
  {
    path: 'currentApplication',
    select: 'applicationNumber status',
  },
  {
    path: 'createdBy',
    select: 'email profile.firstName profile.lastName',
  },
    {
    path: 'referredBy',
    select: 'studentId personal.firstName personal.lastName status',
  },
];

export class StudentRepository {
  async findById(id: string): Promise<StudentDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return StudentModel.findById(id)
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
  }

  async findByStudentId(studentId: string): Promise<StudentDocument | null> {
    return StudentModel.findOne({ studentId })
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
  }

  async findByUserId(userId: string): Promise<StudentDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return StudentModel.findOne({ userId: new Types.ObjectId(userId) })
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
  }

  async findByPhone(phone: string, branchId?: string): Promise<StudentDocument | null> {
    const query: FilterQuery<StudentDocument> = { 'contact.phone': phone };
    if (branchId && Types.ObjectId.isValid(branchId)) {
      query.branch = new Types.ObjectId(branchId);
    }
    return StudentModel.findOne(query)
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
  }

  async findByEmail(email: string): Promise<StudentDocument | null> {
    return StudentModel.findOne({ 'contact.email': email.toLowerCase() })
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
  }

  async create(data: CreateStudentData): Promise<StudentDocument> {
    const student = await StudentModel.create(data);
    const populated = await StudentModel.findById(student._id)
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
    if (!populated) throw new Error('Failed to load created student');
    return populated;
  }

  async update(id: string, data: UpdateStudentData): Promise<StudentDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};

    if (data.personal) {
      for (const [k, v] of Object.entries(data.personal)) {
        if (v !== undefined) updateOps[`personal.${k}`] = v;
      }
    }
    if (data.contact) {
      for (const [k, v] of Object.entries(data.contact)) {
        if (v !== undefined) updateOps[`contact.${k}`] = v;
      }
    }
    if (data.emergencyContact) {
      for (const [k, v] of Object.entries(data.emergencyContact)) {
        if (v !== undefined) updateOps[`emergencyContact.${k}`] = v;
      }
    }
    if (data.passport) {
      for (const [k, v] of Object.entries(data.passport)) {
        if (v !== undefined) updateOps[`passport.${k}`] = v;
      }
    }
    if (data.education) {
      for (const [k, v] of Object.entries(data.education)) {
        if (v !== undefined) updateOps[`education.${k}`] = v;
      }
    }
        if (data.assignedCounselor !== undefined) updateOps.assignedCounselor = data.assignedCounselor;
    if (data.branch !== undefined) updateOps.branch = data.branch;
    if (data.status !== undefined) updateOps.status = data.status;
    if (data.notes !== undefined) updateOps.notes = data.notes;
    if (data.referredBy !== undefined) updateOps.referredBy = data.referredBy;
    if (data.referralRelationship !== undefined) updateOps.referralRelationship = data.referralRelationship;
    updateOps.updatedBy = data.updatedBy;

    return StudentModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(STUDENT_POPULATE)
      .lean<StudentDocument | null>();
  }

  async setCurrentApplication(
    id: string,
    applicationId: Types.ObjectId | null,
  ): Promise<void> {
    if (applicationId) {
      await StudentModel.findByIdAndUpdate(id, {
        $set: { currentApplication: applicationId },
      });
    } else {
      await StudentModel.findByIdAndUpdate(id, {
        $unset: { currentApplication: '' },
      });
    }
  }

  async list(
    filter: ListStudentsFilter,
    page: number,
    limit: number,
  ): Promise<ListStudentsResult> {
    const query: FilterQuery<StudentDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.assignedCounselorId && Types.ObjectId.isValid(filter.assignedCounselorId)) {
      query.assignedCounselor = new Types.ObjectId(filter.assignedCounselorId);
    }
    if (filter.fromDate || filter.toDate) {
      query.createdAt = {};
      if (filter.fromDate) query.createdAt.$gte = filter.fromDate;
      if (filter.toDate) query.createdAt.$lte = filter.toDate;
    }
    if (filter.search) {
      const s = filter.search.trim();
      query.$or = [
        { studentId: { $regex: s, $options: 'i' } },
        { 'personal.firstName': { $regex: s, $options: 'i' } },
        { 'personal.lastName': { $regex: s, $options: 'i' } },
        { 'contact.phone': { $regex: s, $options: 'i' } },
        { 'contact.email': { $regex: s, $options: 'i' } },
        { 'passport.number': { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      StudentModel.find(query)
        .populate(STUDENT_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<StudentDocument[]>(),
      StudentModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }

  async countByStatus(branchId?: string): Promise<Record<string, number>> {
    const matchStage: Record<string, unknown> = {};
    if (branchId && Types.ObjectId.isValid(branchId)) {
      matchStage.branch = new Types.ObjectId(branchId);
    }

    const results = await StudentModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r._id] = r.count;
    }
    return counts;
  }
}

export const studentRepository = new StudentRepository();