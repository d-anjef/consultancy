import { Types, type FilterQuery } from 'mongoose';
import { LeadModel, type LeadDocument } from './lead.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';
import type { LeadStatus, LeadSource } from '@consultancy/config';

export interface CreateLeadData {
  leadNumber: string;
  branch: Types.ObjectId;
  personal: LeadDocument['personal'];
  source: LeadSource;
  sourceMetadata?: LeadDocument['sourceMetadata'];
  interestedProgram?: Types.ObjectId;
  interestedVisaCategory?: Types.ObjectId;
  preferredCounseling?: LeadDocument['preferredCounseling'];
  assignedCounselor?: Types.ObjectId;
  notes?: string;
  createdBy: Types.ObjectId;
}

export interface UpdateLeadData {
  personal?: Partial<LeadDocument['personal']>;
  interestedProgram?: Types.ObjectId;
  interestedVisaCategory?: Types.ObjectId;
  preferredCounseling?: LeadDocument['preferredCounseling'];
  notes?: string;
  updatedBy: Types.ObjectId;
}

export interface ListLeadsFilter {
  branchId?: string;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedCounselorId?: string;
  fromDate?: Date;
  toDate?: Date;
}

const LEAD_POPULATE = [
  { path: 'branch', select: 'code name' },
  { path: 'assignedCounselor', select: 'email profile.firstName profile.lastName' },
  { path: 'interestedProgram', select: 'code name type' },
  { path: 'interestedVisaCategory', select: 'code name' },
  { path: 'convertedToStudent', select: 'studentId personal.firstName personal.lastName' },
  { path: 'createdBy', select: 'email profile.firstName profile.lastName' },
];

export class LeadRepository {
  async findById(id: string): Promise<LeadDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return LeadModel.findById(id).populate(LEAD_POPULATE).lean<LeadDocument | null>();
  }

  async findByPhone(phone: string, branchId?: string): Promise<LeadDocument | null> {
    const query: FilterQuery<LeadDocument> = { 'personal.phone': phone };
    if (branchId && Types.ObjectId.isValid(branchId)) {
      query.branch = new Types.ObjectId(branchId);
    }
    return LeadModel.findOne(query).populate(LEAD_POPULATE).lean<LeadDocument | null>();
  }

  async create(data: CreateLeadData): Promise<LeadDocument> {
    const lead = await LeadModel.create(data);
    const populated = await LeadModel.findById(lead._id)
      .populate(LEAD_POPULATE)
      .lean<LeadDocument | null>();
    if (!populated) throw new Error('Failed to load created lead');
    return populated;
  }

  async update(id: string, data: UpdateLeadData): Promise<LeadDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateOps: Record<string, unknown> = {};

    if (data.personal) {
      for (const [k, v] of Object.entries(data.personal)) {
        if (v !== undefined) updateOps[`personal.${k}`] = v;
      }
    }
    if (data.interestedProgram !== undefined) updateOps.interestedProgram = data.interestedProgram;
    if (data.interestedVisaCategory !== undefined) updateOps.interestedVisaCategory = data.interestedVisaCategory;
    if (data.preferredCounseling !== undefined) updateOps.preferredCounseling = data.preferredCounseling;
    if (data.notes !== undefined) updateOps.notes = data.notes;
    updateOps.updatedBy = data.updatedBy;

    return LeadModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .populate(LEAD_POPULATE)
      .lean<LeadDocument | null>();
  }

  async updateStatus(
    id: string,
    status: LeadStatus,
    updatedBy: Types.ObjectId,
  ): Promise<LeadDocument | null> {
    return LeadModel.findByIdAndUpdate(
      id,
      { $set: { status, updatedBy } },
      { new: true },
    )
      .populate(LEAD_POPULATE)
      .lean<LeadDocument | null>();
  }

  async assignCounselor(
    id: string,
    counselorId: Types.ObjectId,
    updatedBy: Types.ObjectId,
  ): Promise<LeadDocument | null> {
    return LeadModel.findByIdAndUpdate(
      id,
      { $set: { assignedCounselor: counselorId, updatedBy } },
      { new: true },
    )
      .populate(LEAD_POPULATE)
      .lean<LeadDocument | null>();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await LeadModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async list(
    filter: ListLeadsFilter,
    page: number,
    limit: number,
  ): Promise<{ items: LeadDocument[]; pagination: PaginationMeta }> {
    const query: FilterQuery<LeadDocument> = {};

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branch = new Types.ObjectId(filter.branchId);
    }
    if (filter.status) query.status = filter.status;
    if (filter.source) query.source = filter.source;
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
        { leadNumber: { $regex: s, $options: 'i' } },
        { 'personal.firstName': { $regex: s, $options: 'i' } },
        { 'personal.lastName': { $regex: s, $options: 'i' } },
        { 'personal.phone': { $regex: s, $options: 'i' } },
        { 'personal.email': { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LeadModel.find(query)
        .populate(LEAD_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeadDocument[]>(),
      LeadModel.countDocuments(query),
    ]);

    return { items, pagination: createPaginationMeta(page, limit, total) };
  }

  async countByStatus(branchId?: string): Promise<Record<string, number>> {
    const matchStage: Record<string, unknown> = {};
    if (branchId && Types.ObjectId.isValid(branchId)) {
      matchStage.branch = new Types.ObjectId(branchId);
    }
    const results = await LeadModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const r of results) counts[r._id] = r.count;
    return counts;
  }
}

export const leadRepository = new LeadRepository();