import { Types } from 'mongoose';
import type {
  CreateBranchDto,
  UpdateBranchDto,
  ListBranchesQueryDto,
} from '@consultancy/validators';
import { branchRepository } from './branch.repository.js';
import type { BranchDocument } from './branch.model.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import type { PaginationMeta } from '@consultancy/types';

export interface FormattedBranch {
  id: string;
  code: string;
  name: string;
  address: {
    street: string;
    city: string;
    district: string;
    province: string;
    country: string;
    postalCode?: string;
  };
  phone: string;
  email: string;
  timezone: string;
  manager: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListBranchesResponse {
  items: FormattedBranch[];
  pagination: PaginationMeta;
}

export class BranchService {
  async listBranches(query: ListBranchesQueryDto): Promise<ListBranchesResponse> {
    const { items, pagination } = await branchRepository.list(
      { search: query.search, isActive: query.isActive },
      query.page,
      query.limit,
    );

    return {
      items: items.map((b) => this.formatBranch(b)),
      pagination,
    };
  }

  async listActiveBranches(): Promise<FormattedBranch[]> {
    const branches = await branchRepository.findActive();
    return branches.map((b) => this.formatBranch(b));
  }

  async getBranchById(id: string): Promise<FormattedBranch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Branch', id);
    }

    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw new NotFoundError('Branch', id);
    }

    return this.formatBranch(branch);
  }

  async createBranch(
    data: CreateBranchDto,
    createdBy: string,
  ): Promise<FormattedBranch> {
    const existing = await branchRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Branch with code "${data.code}" already exists`);
    }

    const branch = await branchRepository.create({
      code: data.code,
      name: data.name,
      address: {
        ...data.address,
        country: data.address.country || 'Nepal',
      },
      phone: data.phone,
      email: data.email,
      timezone: data.timezone || 'Asia/Kathmandu',
      manager: data.managerId ? new Types.ObjectId(data.managerId) : undefined,
      createdBy: new Types.ObjectId(createdBy),
    });

    return this.formatBranch(branch);
  }

  async updateBranch(
    id: string,
    data: UpdateBranchDto,
    updatedBy: string,
  ): Promise<FormattedBranch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Branch', id);
    }

    const existing = await branchRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Branch', id);
    }

    const updated = await branchRepository.update(id, {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      manager: data.managerId ? new Types.ObjectId(data.managerId) : undefined,
      isActive: data.isActive,
      updatedBy: new Types.ObjectId(updatedBy),
    });

    if (!updated) {
      throw new NotFoundError('Branch', id);
    }

    return this.formatBranch(updated);
  }

  async deactivateBranch(id: string, updatedBy: string): Promise<FormattedBranch> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Branch', id);
    }

    const deactivated = await branchRepository.deactivate(
      id,
      new Types.ObjectId(updatedBy),
    );
    if (!deactivated) {
      throw new NotFoundError('Branch', id);
    }

    return this.formatBranch(deactivated);
  }

  private formatBranch(b: BranchDocument): FormattedBranch {
    return {
      id: String(b._id),
      code: b.code,
      name: b.name,
      address: {
        street: b.address.street,
        city: b.address.city,
        district: b.address.district,
        province: b.address.province,
        country: b.address.country,
        postalCode: b.address.postalCode,
      },
      phone: b.phone,
      email: b.email,
      timezone: b.timezone,
      manager: b.manager ? String(b.manager) : null,
      isActive: b.isActive,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }
}

export const branchService = new BranchService();