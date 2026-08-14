import { api } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api.types';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
export type AttendanceMethod = 'QR_SCAN' | 'MANUAL';

export interface AttendanceRecord {
  id: string;
  user: { id: string; email: string; firstName: string; lastName: string };
  userType: 'STUDENT' | 'TEACHER';
  branch: { id: string; code: string; name: string };
  class?: { id: string; classCode: string; name: string } | null;
  date: string;
  scannedAt: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  scannedBy: { id: string; firstName: string; lastName: string };
  editedAt?: string;
  editReason?: string;
  notes?: string;
  createdAt: string;
}

export interface QRIdentity {
  token: string;
  qrPayload: string;
  qrCodeDataUrl: string;
}

export interface ListAttendanceParams {
  page?: number;
  limit?: number;
  branchId?: string;
  userId?: string;
  userType?: 'STUDENT' | 'TEACHER';
  classId?: string;
  status?: AttendanceStatus;
  fromDate?: string;
  toDate?: string;
  date?: string;
}

export interface DailySummary {
  STUDENT: Record<string, number>;
  TEACHER: Record<string, number>;
}

export const attendanceApi = {
  list: async (params: ListAttendanceParams = {}) => {
    const items = await api.get<AttendanceRecord[]>(
      '/attendance',
      params as Record<string, unknown>,
    );
    return {
      items,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: items.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      } as PaginationMeta,
    };
  },

  getOwn: (fromDate?: string, toDate?: string): Promise<AttendanceRecord[]> =>
    api.get<AttendanceRecord[]>('/attendance/me', { fromDate, toDate }),

  scan: (qrPayload: string, classId?: string): Promise<AttendanceRecord> =>
    api.post<AttendanceRecord>('/attendance/scan', { qrPayload, classId }),

  manual: (data: {
    userId: string;
    userType: 'STUDENT' | 'TEACHER';
    classId?: string;
    status?: AttendanceStatus;
    date?: string;
    notes?: string;
  }): Promise<AttendanceRecord> =>
    api.post<AttendanceRecord>('/attendance/manual', data),

  edit: (id: string, status: AttendanceStatus, reason: string): Promise<AttendanceRecord> =>
    api.patch<AttendanceRecord>(`/attendance/${id}`, { status, reason }),

  dailySummary: (branchId?: string, date?: string): Promise<DailySummary> =>
    api.get<DailySummary>('/attendance/daily-summary', { branchId, date }),

  getMyQR: (): Promise<QRIdentity> => api.get<QRIdentity>('/qr/me'),

  rotateQR: (): Promise<QRIdentity> => api.post<QRIdentity>('/qr/me/rotate'),
};