import { Types } from 'mongoose';
import type { CreateRoleDto, UpdateRoleDto } from '@consultancy/validators';
import type { PermissionCode } from '@consultancy/config';
import { roleRepository } from './role.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';
import type { RoleDocument } from './role.model.js';
import type { PermissionDocument } from '../permissions/permission.model.js';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
} from '../../lib/errors.js';

export interface RoleWithPermissions {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  permissions: string[];
  permissionDetails: Array<{ code: string; category: string; description: string }>;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RoleService {
  async listRoles(): Promise<RoleWithPermissions[]> {
    const roles = await roleRepository.findAll();
    return roles.map((role) => this.formatRole(role));
  }

  async getRoleById(id: string): Promise<RoleWithPermissions> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Role', id);
    }

    const role = await roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role', id);
    }

    return this.formatRole(role);
  }

  async getRoleByCode(code: string): Promise<RoleDocument | null> {
    return roleRepository.findByCode(code);
  }

  async createRole(data: CreateRoleDto): Promise<RoleWithPermissions> {
    const existing = await roleRepository.findByCodeWithoutPopulate(data.code);
    if (existing) {
      throw new ConflictError(`Role with code "${data.code}" already exists`);
    }

    const permissionDocs = await permissionRepository.findByCodes(
      data.permissions as PermissionCode[],
    );

    if (permissionDocs.length !== data.permissions.length) {
      const foundCodes = new Set(permissionDocs.map((p) => p.code));
      const invalidCodes = data.permissions.filter((code) => !foundCodes.has(code));
      throw new BusinessRuleError(
        `Invalid permission codes: ${invalidCodes.join(', ')}`,
      );
    }

    const role = await roleRepository.create({
      code: data.code,
      displayName: data.displayName,
      description: data.description,
      permissions: permissionDocs.map((p) => p._id as Types.ObjectId),
      isSystem: false,
    });

    return this.getRoleById(String(role._id));
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<RoleWithPermissions> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Role', id);
    }

    const existing = await roleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Role', id);
    }

    if (existing.isSystem && data.permissions) {
      const roleCode = existing.code;
      if (['SUPER_ADMIN'].includes(roleCode)) {
        throw new ForbiddenError(
          'Cannot modify permissions of the Super Admin role.',
        );
      }
    }

    const updateData: {
      displayName?: string;
      description?: string;
      permissions?: Types.ObjectId[];
    } = {};

    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.permissions !== undefined) {
      const permissionDocs = await permissionRepository.findByCodes(
        data.permissions as PermissionCode[],
      );
      if (permissionDocs.length !== data.permissions.length) {
        const foundCodes = new Set(permissionDocs.map((p) => p.code));
        const invalidCodes = data.permissions.filter((code) => !foundCodes.has(code));
        throw new BusinessRuleError(
          `Invalid permission codes: ${invalidCodes.join(', ')}`,
        );
      }
      updateData.permissions = permissionDocs.map((p) => p._id as Types.ObjectId);
    }

    const updated = await roleRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundError('Role', id);
    }

    return this.formatRole(updated);
  }

  async deleteRole(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Role', id);
    }

    const role = await roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role', id);
    }

    if (role.isSystem) {
      throw new ForbiddenError('System roles cannot be deleted.');
    }

    const deleted = await roleRepository.delete(id);
    if (!deleted) {
      throw new BusinessRuleError('Role could not be deleted.');
    }
  }

  private formatRole(role: RoleDocument): RoleWithPermissions {
    const populated = role.permissions as unknown as PermissionDocument[];
    const permissionCodes = populated.map((p) => p.code);
    const permissionDetails = populated.map((p) => ({
      code: p.code,
      category: p.category,
      description: p.description,
    }));

    return {
      id: String(role._id),
      code: role.code,
      displayName: role.displayName,
      description: role.description,
      permissions: permissionCodes,
      permissionDetails,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

export const roleService = new RoleService();