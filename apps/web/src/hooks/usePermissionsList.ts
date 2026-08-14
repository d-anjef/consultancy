'use client';

import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/lib/api/permissions';

export function usePermissionsGrouped() {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: () => permissionsApi.listGrouped(),
    staleTime: 10 * 60_000, // permissions rarely change
  });
}

export function usePermissionsList() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.list(),
    staleTime: 10 * 60_000,
  });
}