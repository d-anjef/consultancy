'use client';

import { BarChart3, Users, FileText, Wallet, ClipboardCheck } from 'lucide-react';
import {
  useOverviewReport,
  useLeadConversionReport,
  useApplicationPipelineReport,
  useFinanceSummaryReport,
  useAttendanceSummaryReport,
} from '@/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { formatNPR } from '@/lib/utils/currency';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportsPage() {
  const { data: overview, isLoading: overviewLoading } = useOverviewReport();
  const { data: leadReport } = useLeadConversionReport();
  const { data: appReport } = useApplicationPipelineReport();
  const { data: financeReport } = useFinanceSummaryReport();
  const { data: attendanceReport } = useAttendanceSummaryReport();

  if (overviewLoading) return <LoadingState fullPage message="Loading reports…" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analytics and insights across the organization
        </p>
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Leads</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{overview.totalLeads}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Students</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{overview.totalStudents}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Students</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-success">{overview.activeStudents}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Applications</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{overview.totalApplications}</p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Conversion */}
        {leadReport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lead Conversion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold tabular-nums text-foreground">
                    {leadReport.conversionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leadReport.converted} of {leadReport.total} leads converted
                  </p>
                </div>
                <Badge variant="accent" className="text-lg px-3 py-1">
                  {leadReport.conversionRate}%
                </Badge>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  By Source
                </p>
                <div className="space-y-1">
                  {Object.entries(leadReport.bySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{source.replace(/_/g, ' ')}</span>
                        <span className="font-medium tabular-nums text-foreground">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {leadReport.monthly.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Monthly Trend
                  </p>
                  <div className="space-y-1">
                    {leadReport.monthly.slice(0, 6).map((m) => (
                      <div key={`${m.year}-${m.month}`} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {MONTH_NAMES[m.month - 1]} {m.year}
                        </span>
                        <span className="tabular-nums">
                          {m.leads} leads · {m.converted} converted ({m.rate}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Pipeline */}
        {appReport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Application Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold tabular-nums text-foreground">
                    {appReport.successRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visa success rate ({appReport.total} total)
                  </p>
                </div>
                <Badge variant="success" className="text-lg px-3 py-1">
                  {appReport.successRate}%
                </Badge>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  By Status
                </p>
                <div className="space-y-1">
                  {Object.entries(appReport.byStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{status.replace(/_/g, ' ')}</span>
                        <span className="font-medium tabular-nums text-foreground">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finance */}
        {financeReport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Finance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Invoiced</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {formatNPR(financeReport.totalInvoiced)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Collected</p>
                  <p className="text-xl font-bold tabular-nums text-success">
                    {formatNPR(financeReport.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-xl font-bold tabular-nums text-destructive">
                    {formatNPR(financeReport.totalOutstanding)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Collection Rate</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {financeReport.collectionRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance */}
        {attendanceReport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Attendance (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold tabular-nums text-foreground">
                    {attendanceReport.attendanceRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Overall attendance rate
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {Object.entries(attendanceReport.byStatus)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{status}</span>
                      <span className="font-medium tabular-nums text-foreground">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}