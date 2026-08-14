import { api } from '@/lib/api/client';

export interface OverviewReport {
  totalLeads: number;
  totalStudents: number;
  activeStudents: number;
  totalApplications: number;
}

export interface LeadConversionReport {
  total: number;
  converted: number;
  conversionRate: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  monthly: Array<{ year: number; month: number; leads: number; converted: number; rate: number }>;
}

export interface ApplicationPipelineReport {
  total: number;
  byStatus: Record<string, number>;
  successRate: number;
  byVisa: Record<string, Record<string, number>>;
}

export interface FinanceSummaryReport {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  count: number;
  collectionRate: number;
  monthly: Array<{ year: number; month: number; invoiced: number; collected: number }>;
}

export interface AttendanceSummaryReport {
  total: number;
  byStatus: Record<string, number>;
  attendanceRate: number;
  daily: Record<string, Record<string, number>>;
}

export const reportsApi = {
  overview: (): Promise<OverviewReport> => api.get<OverviewReport>('/reports/overview'),
  leads: (): Promise<LeadConversionReport> => api.get<LeadConversionReport>('/reports/leads'),
  applications: (): Promise<ApplicationPipelineReport> => api.get<ApplicationPipelineReport>('/reports/applications'),
  finance: (): Promise<FinanceSummaryReport> => api.get<FinanceSummaryReport>('/reports/finance'),
  attendance: (): Promise<AttendanceSummaryReport> => api.get<AttendanceSummaryReport>('/reports/attendance'),
};