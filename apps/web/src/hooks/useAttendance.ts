'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  attendanceApi,
  type AttendanceRecord,
  type ListAttendanceParams,
  type AttendanceStatus,
  type QRIdentity,
} from '@/lib/api/attendance';

export function useAttendance(params: ListAttendanceParams = {}) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceApi.list(params),
    staleTime: 30_000,
  });
}

export function useOwnAttendance(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['attendance', 'me', { fromDate, toDate }],
    queryFn: () => attendanceApi.getOwn(fromDate, toDate),
    staleTime: 30_000,
  });
}

export function useDailySummary(branchId?: string, date?: string) {
  return useQuery({
    queryKey: ['attendance', 'daily-summary', { branchId, date }],
    queryFn: () => attendanceApi.dailySummary(branchId, date),
    staleTime: 60_000,
  });
}

export function useMyQR() {
  return useQuery({
    queryKey: ['qr', 'me'],
    queryFn: () => attendanceApi.getMyQR(),
  });
}

export function useScanAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qrPayload, classId }: { qrPayload: string; classId?: string }) =>
      attendanceApi.scan(qrPayload, classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof attendanceApi.manual>[0]) =>
      attendanceApi.manual(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useEditAttendance(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, reason }: { status: AttendanceStatus; reason: string }) =>
      attendanceApi.edit(id, status, reason),
    onSuccess: (updated: AttendanceRecord) => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRotateQR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.rotateQR(),
    onSuccess: (result: QRIdentity) => {
      qc.setQueryData(['qr', 'me'], result);
    },
  });
}