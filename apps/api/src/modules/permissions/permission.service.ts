import { permissionRepository } from './permission.repository.js';
import type { PermissionDocument } from './permission.model.js';
import type { PermissionCode } from '@consultancy/config';

export class PermissionService {
  async listAll(): Promise<PermissionDocument[]> {
    return permissionRepository.findAll();
  }

  async listByCategory(): Promise<Record<string, PermissionDocument[]>> {
    const all = await permissionRepository.findAll();
    const grouped: Record<string, PermissionDocument[]> = {};

    for (const permission of all) {
      const category = permission.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    }

    return grouped;
  }

  async findByCodes(codes: PermissionCode[]): Promise<PermissionDocument[]> {
    return permissionRepository.findByCodes(codes);
  }
}

export const permissionService = new PermissionService();