import type { FilterQuery, Types } from 'mongoose';
import { BranchModel, type BranchDocument, type BranchAddress } from './branch.model.js';
import { createPaginationMeta } from '../../lib/pagination.js';
import type { PaginationMeta } from '@consultancy/types';

export interface CreateBranchData {
  code: string;
  name: string;
  address: BranchAddress;
  phone: string;
  email: string;
  timezone?: string;
  manager?: Types.ObjectId;
  createdBy: Types.ObjectId;
}

export interface UpdateBranchData {
  name?: string;
  address?: Partial<BranchAddress>;
  phone?: string;
  email?: string;
  manager?: Types.ObjectId;
  isActive?: boolean;
  updatedBy: Types.ObjectId;
}

export interface ListBranchesFilter {
  search?: string;
  isActive?: boolean;
}

export interface ListBranchesResult {
  items: BranchDocument[];
  pagination: PaginationMeta;
}

export class BranchRepository {
  async findAll(): Promise<BranchDocument[]> {
    return BranchModel.find().sort({ name: 1 }).lean<BranchDocument[]>();
  }

  async findActive(): Promise<BranchDocument[]> {
    return BranchModel.find({ isActive: true }).sort({ name: 1 }).lean<BranchDocument[]>();
  }

  async findById(id: string): Promise<BranchDocument | null> {
    return BranchModel.findById(id).lean<BranchDocument | null>();
  }

  async findByCode(code: string): Promise<BranchDocument | null> {
    return BranchModel.findOne({ code: code.toUpperCase() }).lean<BranchDocument | null>();
  }

  async list(
    filter: ListBranchesFilter,
    page: number,
    limit: number,
  ): Promise<ListBranchesResult> {
    const query: FilterQuery<BranchDocument> = {};

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    if (filter.search) {
      const search = filter.search.trim();
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      BranchModel.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<BranchDocument[]>(),
      BranchModel.countDocuments(query),
    ]);

    return {
      items,
      pagination: createPaginationMeta(page, limit, total),
    };
  }

  async create(data: CreateBranchData): Promise<BranchDocument> {
    const branch = await BranchModel.create({
      ...data,
      code: data.code.toUpperCase(),
    });
    return branch.toObject() as BranchDocument;
  }

  async update(id: string, data: UpdateBranchData): Promise<BranchDocument | null> {
    const updateOps: Record<string, unknown> = {};

    if (data.name !== undefined) updateOps.name = data.name;
    if (data.phone !== undefined) updateOps.phone = data.phone;
    if (data.email !== undefined) updateOps.email = data.email;
    if (data.manager !== undefined) updateOps.manager = data.manager;
    if (data.isActive !== undefined) updateOps.isActive = data.isActive;
    if (data.address) {
      for (const [k, v] of Object.entries(data.address)) {
        if (v !== undefined) {
          updateOps[`address.${k}`] = v;
        }
      }
    }
    updateOps.updatedBy = data.updatedBy;

    return BranchModel.findByIdAndUpdate(id, { $set: updateOps }, { new: true })
      .lean<BranchDocument | null>();
  }

  async deactivate(id: string, updatedBy: Types.ObjectId): Promise<BranchDocument | null> {
    return BranchModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false, updatedBy } },
      { new: true },
    ).lean<BranchDocument | null>();
  }

  async count(): Promise<number> {
    return BranchModel.countDocuments();
  }
}

export const branchRepository = new BranchRepository();