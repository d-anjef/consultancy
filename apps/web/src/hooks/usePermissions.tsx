'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionCode } from '@consultancy/config';

/**
 * Hook for checking user permissions.
 * NOTE: This is UX-only. Backend is the true security boundary.
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(
    () => new Set(user?.role.permissions ?? []),
    [user],
  );

  const has = (permission: PermissionCode): boolean => permissions.has(permission);
  const hasPermission = has; // alias

  const hasAll = (...perms: PermissionCode[]): boolean =>
    perms.every((p) => permissions.has(p));

  const hasAny = (...perms: PermissionCode[]): boolean =>
    perms.some((p) => permissions.has(p));

  const hasNone = (...perms: PermissionCode[]): boolean =>
    perms.every((p) => !permissions.has(p));

  return {
    permissions,
    has,
    hasPermission,
    hasAll,
    hasAny,
    hasNone,
    roleCode: user?.role.code,
    isStudent: user?.role.code === 'STUDENT',
    isSuperAdmin: user?.role.code === 'SUPER_ADMIN',
    isAdmin: user?.role.code === 'ADMIN',
    isBranchManager: user?.role.code === 'BRANCH_MANAGER',
    isCounselor: user?.role.code === 'COUNSELOR',
    isReceptionist: user?.role.code === 'RECEPTIONIST',
    isTeacher: user?.role.code === 'TEACHER',
  };
}