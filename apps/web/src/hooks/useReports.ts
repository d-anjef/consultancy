'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';

export function useOverviewReport() {
  return useQuery({ queryKey: ['reports', 'overview'], queryFn: () => reportsApi.overview(), staleTime: 2 * 60_000 });
}

export function useLeadConversionReport() {
  return useQuery({ queryKey: ['reports', 'leads'], queryFn: () => reportsApi.leads(), staleTime: 2 * 60_000 });
}

export function useApplicationPipelineReport() {
  return useQuery({ queryKey: ['reports', 'applications'], queryFn: () => reportsApi.applications(), staleTime: 2 * 60_000 });
}

export function useFinanceSummaryReport() {
  return useQuery({ queryKey: ['reports', 'finance'], queryFn: () => reportsApi.finance(), staleTime: 2 * 60_000 });
}

export function useAttendanceSummaryReport() {
  return useQuery({ queryKey: ['reports', 'attendance'], queryFn: () => reportsApi.attendance(), staleTime: 2 * 60_000 });
}