'use client';

import {
  Users,
  UserPlus,
  FileText,
  Wallet,
  CalendarClock,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Files,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionGuard } from '@/components/shared/PermissionGuard/PermissionGuard';
import { PERMISSION_CODES } from '@consultancy/config';
import { useOverviewReport } from '@/hooks/useReports';
import { useLeadStats } from '@/hooks/useLeads';
import { useFinanceStats } from '@/hooks/useFinance';
import { useDocumentStats } from '@/hooks/useDocuments';
import { useCounselings } from '@/hooks/useCounseling';
import { useStudentStats } from '@/hooks/useStudents';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString('en-NP')}`;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString(),
  };
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  isLoading?: boolean;
  href?: string;
  accent?: boolean;
}

function StatCard({ label, value, icon: Icon, sub, isLoading, href, accent }: StatCardProps) {
  const inner = (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        accent ? 'border-yellow-400/60' : ''
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            )}
            {sub && !isLoading && (
              <p className="text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <div
            className={`rounded-lg p-2 ${
              accent ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {href && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

// ─── Counseling Status Badge ─────────────────────────────────────────────────

function CounselingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    NO_SHOW: { label: 'No Show', className: 'bg-orange-100 text-orange-700' },
    RESCHEDULED: { label: 'Rescheduled', className: 'bg-purple-100 text-purple-700' },
  };

  const config =
    map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  // Data hooks
  const { data: overview, isLoading: overviewLoading } = useOverviewReport();
  const { data: leadStats, isLoading: leadStatsLoading } = useLeadStats();
  const { data: financeStats, isLoading: financeLoading } = useFinanceStats();
  const { data: docStats, isLoading: docLoading } = useDocumentStats();
  const { data: studentStats, isLoading: studentStatsLoading } = useStudentStats();

  // Today's counseling sessions
  const todayRange = getTodayRange();
  const { data: todayCounselingData, isLoading: counselingLoading } = useCounselings({
    fromDate: todayRange.fromDate,
    toDate: todayRange.toDate,
    limit: 10,
  });

  if (!user) return null;

  const firstName = user.profile.firstName;
  const todaySessions = todayCounselingData?.items ?? [];

  // Pending document actions
  const pendingDocCount =
    (docStats?.byStatus?.SUBMITTED ?? 0) + (docStats?.byStatus?.UNDER_REVIEW ?? 0);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {user.branch?.name ?? 'Organization'}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* ── Top Stats Grid ── */}
      <PermissionGuard
        requireAny={[
          PERMISSION_CODES.VIEW_STUDENT,
          PERMISSION_CODES.VIEW_LEAD,
          PERMISSION_CODES.VIEW_APPLICATION,
          PERMISSION_CODES.VIEW_FINANCE,
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
            <StatCard
              label="Total Leads"
              value={overviewLoading ? '—' : overview?.totalLeads ?? 0}
              icon={UserPlus}
              sub={
                leadStats
                  ? `${leadStats.byStatus?.NEW ?? 0} new · ${
                      leadStats.byStatus?.QUALIFIED ?? 0
                    } qualified`
                  : undefined
              }
              isLoading={overviewLoading}
              href="/leads"
            />
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_STUDENT]}>
            <StatCard
              label="Active Students"
              value={
                studentStatsLoading
                  ? '—'
                  : studentStats?.byStatus?.ACTIVE ?? overview?.activeStudents ?? 0
              }
              icon={Users}
              sub={overview ? `${overview.totalStudents} total enrolled` : undefined}
              isLoading={overviewLoading || studentStatsLoading}
              href="/students"
            />
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_APPLICATION]}>
            <StatCard
              label="Applications"
              value={overviewLoading ? '—' : overview?.totalApplications ?? 0}
              icon={FileText}
              isLoading={overviewLoading}
              href="/applications"
            />
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
            <StatCard
              label="Outstanding Fees"
              value={
                financeLoading ? '—' : formatCurrency(financeStats?.totalOutstanding ?? 0)
              }
              icon={Wallet}
              sub={
                financeStats?.overdueCount
                  ? `${financeStats.overdueCount} overdue invoice${
                      financeStats.overdueCount !== 1 ? 's' : ''
                    }`
                  : 'All payments up to date'
              }
              isLoading={financeLoading}
              href="/finance"
              accent={!!financeStats?.overdueAmount}
            />
          </PermissionGuard>
        </div>
      </PermissionGuard>

      {/* ── Two Column ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Counseling */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_COUNSELING]}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4" />
                Today's Counseling
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {counselingLoading ? '…' : todaySessions.length}
                </Badge>
                <Link
                  href="/counseling"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-7 px-2 text-xs',
                  })}
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {counselingLoading ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : todaySessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No sessions scheduled for today.
                </div>
              ) : (
                <div className="divide-y">
                  {todaySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {session.lead?.firstName} {session.lead?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.scheduledDate
                            ? new Date(session.scheduledDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                          {session.counselor
                            ? ` · ${session.counselor.firstName} ${session.counselor.lastName}`
                            : ''}
                        </p>
                      </div>
                      <CounselingStatusBadge status={session.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </PermissionGuard>

        {/* Pending Document Actions */}
        <PermissionGuard
          requireAny={[
            PERMISSION_CODES.VERIFY_DOCUMENT,
            PERMISSION_CODES.FINAL_APPROVE_DOCUMENT,
          ]}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4" />
                Pending Document Actions
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={pendingDocCount > 0 ? 'warning' : 'secondary'}>
                  {docLoading ? '…' : pendingDocCount}
                </Badge>
                <Link
                  href="/documents"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'h-7 px-2 text-xs',
                  })}
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {docLoading ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : pendingDocCount === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  All caught up — no pending actions.
                </div>
              ) : (
                <div className="space-y-3">
                  {(docStats?.byStatus?.SUBMITTED ?? 0) > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-foreground">Awaiting Review</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {docStats?.byStatus?.SUBMITTED}
                      </span>
                    </div>
                  )}
                  {(docStats?.byStatus?.UNDER_REVIEW ?? 0) > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-sm text-foreground">Under Review</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {docStats?.byStatus?.UNDER_REVIEW}
                      </span>
                    </div>
                  )}
                  <Link
                    href="/documents?status=SUBMITTED"
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'w-full',
                    })}
                  >
                    Review Documents
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>

      {/* ── Overdue Payments ── */}
      <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
        {(financeStats?.overdueCount ?? 0) > 0 && (
          <Card className="border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {financeStats?.overdueCount}
                    </span>{' '}
                    invoice{financeStats?.overdueCount !== 1 ? 's' : ''} overdue
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(financeStats?.overdueAmount ?? 0)}
                  </p>
                </div>
                <Link
                  href="/finance?overdue=true"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  View Overdue
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No overdue — subtle message */}
        {!financeLoading && (financeStats?.overdueCount ?? 0) === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-4 text-center text-sm text-muted-foreground">
                ✅ No overdue payments. Finances are healthy.
              </div>
            </CardContent>
          </Card>
        )}
      </PermissionGuard>

      {/* ── Lead Pipeline Snapshot ── */}
      <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Lead Pipeline
            </CardTitle>
            <Link
              href="/leads"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'h-7 px-2 text-xs',
              })}
            >
              View all leads
            </Link>
          </CardHeader>
          <CardContent>
            {leadStatsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : leadStats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Object.entries(leadStats.byStatus).map(([status, count]) => (
                  <Link
                    key={status}
                    href={`/leads?status=${status}`}
                    className="group rounded-lg border bg-muted/30 p-3 text-center transition-colors hover:bg-muted"
                  >
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {count as number}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {status.replace(/_/g, ' ')}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No lead data available.
              </div>
            )}
          </CardContent>
        </Card>
      </PermissionGuard>

      {/* ── System Overview (SA only) ── */}
      <PermissionGuard requires={[PERMISSION_CODES.VIEW_HEALTH]}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Files className="h-4 w-4" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Organization</span>
              <span className="font-medium text-foreground">
                Chiba Education Center
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Role</span>
              <span className="font-medium text-foreground">
                {user.role.displayName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Permissions</span>
              <span className="font-medium tabular-nums text-foreground">
                {user.role.permissions.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Students</span>
              <span className="font-medium tabular-nums text-foreground">
                {overview?.totalStudents ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Revenue Collected</span>
              <span className="font-medium tabular-nums text-foreground">
                {financeStats ? formatCurrency(financeStats.totalPaid) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  );
}