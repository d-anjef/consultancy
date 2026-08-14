import type { PermissionCode } from '@consultancy/config';
import { PermissionModel, type PermissionDocument } from './permission.model.js';

export class PermissionRepository {
  async findAll(): Promise<PermissionDocument[]> {
    return PermissionModel.find().sort({ category: 1, code: 1 }).lean<PermissionDocument[]>();
  }

  async findByCategory(category: string): Promise<PermissionDocument[]> {
    return PermissionModel.find({ category }).sort({ code: 1 }).lean<PermissionDocument[]>();
  }

  async findByCode(code: PermissionCode): Promise<PermissionDocument | null> {
    return PermissionModel.findOne({ code }).lean<PermissionDocument | null>();
  }

  async findByCodes(codes: PermissionCode[]): Promise<PermissionDocument[]> {
    return PermissionModel.find({ code: { $in: codes } }).lean<PermissionDocument[]>();
  }

  async upsertMany(
    permissions: Array<{ code: string; category: string; description: string }>,
  ): Promise<void> {
    const operations = permissions.map((permission) => ({
      updateOne: {
        filter: { code: permission.code },
        update: { $set: permission },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await PermissionModel.bulkWrite(operations);
    }
  }

  async count(): Promise<number> {
    return PermissionModel.countDocuments();
  }
}

export const permissionRepository = new PermissionRepository();