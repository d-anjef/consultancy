'use client';

import type { ReactNode } from 'react';
import type { PermissionCode } from '@consultancy/config';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Requires ALL listed permissions */
  requires?: PermissionCode[];
  /** Requires ANY of the listed permissions */
  requireAny?: PermissionCode[];
  /** Denies if user has ANY of these permissions */
  denyIf?: PermissionCode[];
}

/**
 * Client-side permission gate.
 * NOTE: This is UX-only. Backend enforces true authorization.
 */
export function PermissionGuard({
  children,
  fallback = null,
  requires,
  requireAny,
  denyIf,
}: PermissionGuardProps) {
  const { hasAll, hasAny } = usePermissions();

  if (denyIf && denyIf.length > 0 && hasAny(...denyIf)) {
    return <>{fallback}</>;
  }

  if (requires && requires.length > 0 && !hasAll(...requires)) {
    return <>{fallback}</>;
  }

  if (requireAny && requireAny.length > 0 && !hasAny(...requireAny)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}