import type { Types } from 'mongoose';
import { RoleModel, type RoleDocument } from './role.model.js';

export interface CreateRoleData {
  code: string;
  displayName: string;
  description?: string;
  permissions: Types.ObjectId[];
  isSystem?: boolean;
}

export interface UpdateRoleData {
  displayName?: string;
  description?: string;
  permissions?: Types.ObjectId[];
}

export class RoleRepository {
  async findAll(): Promise<RoleDocument[]> {
    return RoleModel.find()
      .populate('permissions')
      .sort({ code: 1 })
      .lean<RoleDocument[]>();
  }

  async findById(id: string): Promise<RoleDocument | null> {
    return RoleModel.findById(id).populate('permissions').lean<RoleDocument | null>();
  }

  async findByCode(code: string): Promise<RoleDocument | null> {
    return RoleModel.findOne({ code: code.toUpperCase() })
      .populate('permissions')
      .lean<RoleDocument | null>();
  }

  async findByCodeWithoutPopulate(code: string): Promise<RoleDocument | null> {
    return RoleModel.findOne({ code: code.toUpperCase() }).lean<RoleDocument | null>();
  }

  async create(data: CreateRoleData): Promise<RoleDocument> {
    const role = await RoleModel.create({
      ...data,
      code: data.code.toUpperCase(),
      isSystem: data.isSystem ?? false,
    });
    return role.toObject() as RoleDocument;
  }

  async update(id: string, data: UpdateRoleData): Promise<RoleDocument | null> {
    return RoleModel.findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate('permissions')
      .lean<RoleDocument | null>();
  }

  async delete(id: string): Promise<boolean> {
    const result = await RoleModel.deleteOne({ _id: id, isSystem: false });
    return result.deletedCount > 0;
  }

  async upsertSystemRole(data: CreateRoleData): Promise<RoleDocument> {
    const upserted = await RoleModel.findOneAndUpdate(
      { code: data.code.toUpperCase() },
      {
        $set: {
          displayName: data.displayName,
          description: data.description,
          permissions: data.permissions,
          isSystem: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate('permissions')
      .lean<RoleDocument | null>();

    if (!upserted) {
      throw new Error(`Failed to upsert system role: ${data.code}`);
    }
    return upserted;
  }

  async count(): Promise<number> {
    return RoleModel.countDocuments();
  }
}

export const roleRepository = new RoleRepository();