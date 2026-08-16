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
  ArrowUpRight,
  Sparkles,
  Building2,
  ArrowRight,
  BookOpen,
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
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString('en-NP')}`;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { fromDate: start.toISOString(), toDate: end.toISOString() };
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: overview, isLoading: overviewLoading } = useOverviewReport();
  const { data: leadStats, isLoading: leadStatsLoading } = useLeadStats();
  const { data: financeStats, isLoading: financeLoading } = useFinanceStats();
  const { data: docStats, isLoading: docLoading } = useDocumentStats();
  const { data: studentStats, isLoading: studentStatsLoading } = useStudentStats();

  const todayRange = getTodayRange();
  const { data: todayCounselingData, isLoading: counselingLoading } = useCounselings({
    fromDate: todayRange.fromDate,
    toDate: todayRange.toDate,
    limit: 8,
  });

  if (!user) return null;

  const firstName = user.profile.firstName;
  const todaySessions = todayCounselingData?.items ?? [];

  const pendingDocCount =
    (docStats?.byStatus?.SUBMITTED ?? 0) + (docStats?.byStatus?.UNDER_REVIEW ?? 0);

  // Collection rate for progress bar (paid / invoiced)
  const collectionRate =
    financeStats && financeStats.totalInvoiced > 0
      ? Math.round((financeStats.totalPaid / financeStats.totalInvoiced) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ────── Row 1: Header + Hero ────── */}
      <div className="grid gap-4 lg:grid-cols-3 animate-fade-in-up animate-delay-0">
        {/* Header + Quick Stats Left */}
        <div className="lg:col-span-2 space-y-4">
          {/* Greeting */}
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

          {/* Two mini-stats with progress bars */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStatWithBar
              label="New Leads"
              value={leadStats?.byStatus?.NEW ?? 0}
              total={leadStats?.total ?? 0}
              color="bg-foreground"
              isLoading={leadStatsLoading}
            />
            <MiniStatWithBar
              label="Collection Rate"
              value={collectionRate}
              total={100}
              suffix="%"
              color="bg-accent"
              isLoading={financeLoading}
            />
          </div>
        </div>

        {/* Hero Card */}
        <HeroCard
          activeStudents={
            studentStats?.byStatus?.ACTIVE ?? overview?.activeStudents ?? 0
          }
          isLoading={studentStatsLoading || overviewLoading}
        />
      </div>

      {/* ────── Row 2: Main KPIs ────── */}
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
            <div className="animate-fade-in-up animate-delay-1">
              <StatCard
                label="Total Leads"
                value={overview?.totalLeads ?? 0}
                icon={UserPlus}
                sub={
                  leadStats
                    ? `${leadStats.byStatus?.QUALIFIED ?? 0} qualified`
                    : undefined
                }
                isLoading={overviewLoading}
                href="/leads"
              />
            </div>
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_STUDENT]}>
            <div className="animate-fade-in-up animate-delay-2">
              <StatCard
                label="Active Students"
                value={
                  studentStats?.byStatus?.ACTIVE ?? overview?.activeStudents ?? 0
                }
                icon={Users}
                sub={
                  overview ? `${overview.totalStudents} total enrolled` : undefined
                }
                isLoading={overviewLoading || studentStatsLoading}
                href="/students"
              />
            </div>
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_APPLICATION]}>
            <div className="animate-fade-in-up animate-delay-3">
              <StatCard
                label="Applications"
                value={overview?.totalApplications ?? 0}
                icon={FileText}
                isLoading={overviewLoading}
                href="/applications"
              />
            </div>
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
            <div className="animate-fade-in-up animate-delay-4">
              <StatCard
                label="Outstanding"
                value={financeStats?.totalOutstanding ?? 0}
                formatValue={(n) => formatCurrency(n)}
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
            </div>
          </PermissionGuard>
        </div>
      </PermissionGuard>

      {/* ────── Row 3: Lead Pipeline Chart + Today's Counseling ────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lead Pipeline as animated bars — 2 columns */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
          <div className="lg:col-span-2 animate-fade-in-up animate-delay-5">
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
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {leadStatsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : leadStats && Object.keys(leadStats.byStatus).length > 0 ? (
                  <LeadPipelineBars byStatus={leadStats.byStatus} />
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No leads yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>

        {/* Today's Counseling — 1 column */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_COUNSELING]}>
          <div className="animate-fade-in-up animate-delay-6">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4" />
                  Today
                </CardTitle>
                <Badge variant="secondary">
                  {counselingLoading ? '…' : todaySessions.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {counselingLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : todaySessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No sessions today.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySessions.slice(0, 4).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 rounded-md border border-border p-2.5 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-light">
                          <span className="text-xs font-bold text-accent-foreground">
                            {session.scheduledDate
                              ? new Date(session.scheduledDate).toLocaleTimeString(
                                  'en-US',
                                  { hour: '2-digit', minute: '2-digit' },
                                )
                              : '—'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {session.lead?.firstName} {session.lead?.lastName}
                          </p>
                          <p className="truncate text-xxs text-muted-foreground">
                            {session.counselor
                              ? `${session.counselor.firstName} ${session.counselor.lastName}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {todaySessions.length > 4 && (
                      <Link
                        href="/counseling"
                        className="block text-center text-xs text-muted-foreground hover:text-foreground pt-1"
                      >
                        +{todaySessions.length - 4} more
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>
      </div>

      {/* ────── Row 4: Documents + Overdue + System ────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending Documents */}
        <PermissionGuard
          requireAny={[
            PERMISSION_CODES.VERIFY_DOCUMENT,
            PERMISSION_CODES.FINAL_APPROVE_DOCUMENT,
          ]}
        >
          <div className="animate-fade-in-up animate-delay-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4" />
                  Documents
                </CardTitle>
                <Badge variant={pendingDocCount > 0 ? 'warning' : 'secondary'}>
                  {docLoading ? '…' : pendingDocCount}
                </Badge>
              </CardHeader>
              <CardContent>
                {docLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8" />
                    <Skeleton className="h-8" />
                  </div>
                ) : pendingDocCount === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    All caught up ✓
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(docStats?.byStatus?.SUBMITTED ?? 0) > 0 && (
                      <StatusRow
                        color="bg-blue-500"
                        label="Awaiting Review"
                        count={docStats?.byStatus?.SUBMITTED ?? 0}
                      />
                    )}
                    {(docStats?.byStatus?.UNDER_REVIEW ?? 0) > 0 && (
                      <StatusRow
                        color="bg-accent"
                        label="Under Review"
                        count={docStats?.byStatus?.UNDER_REVIEW ?? 0}
                      />
                    )}
                    <Link
                      href="/documents?status=SUBMITTED"
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                        className: 'w-full mt-2',
                      })}
                    >
                      Review Now
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>

        {/* Overdue Payments */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
          <div className="animate-fade-in-up animate-delay-6">
            {(financeStats?.overdueCount ?? 0) > 0 ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums text-destructive">
                    <AnimatedNumber
                      value={financeStats?.overdueAmount ?? 0}
                      format={(n) => formatCurrency(n)}
                    />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <AnimatedNumber value={financeStats?.overdueCount ?? 0} />{' '}
                    invoice{financeStats?.overdueCount !== 1 ? 's' : ''}
                  </p>
                  <Link
                    href="/finance?overdue=true"
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'w-full mt-3',
                    })}
                  >
                    View Overdue
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="h-4 w-4 text-success" />
                    Finances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="py-6 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      All payments up to date
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </PermissionGuard>

        {/* System Overview (SA only) */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_HEALTH]}>
          <div className="animate-fade-in-up animate-delay-7">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <SystemRow label="Role" value={user.role.displayName} />
                <SystemRow
                  label="Permissions"
                  value={user.role.permissions.length}
                />
                <SystemRow
                  label="Revenue Collected"
                  value={
                    financeStats ? formatCurrency(financeStats.totalPaid) : '—'
                  }
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="success" className="text-xxs">
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-soft-pulse" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Hero Card ─────────────────────────────────────────────────────────────

function HeroCard({
  activeStudents,
  isLoading,
}: {
  activeStudents: number;
  isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-foreground via-foreground to-neutral-800 p-5 text-primary-foreground min-h-[180px] flex flex-col justify-between">
      {/* Decorative background */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute right-4 top-4 opacity-30">
        <Sparkles className="h-6 w-6 text-accent" />
      </div>

      <div className="relative">
        <p className="text-xs uppercase tracking-wider opacity-70">
          Journey to Japan
        </p>
        <h2 className="mt-1 text-lg font-bold">
          Empowering Students, Building Futures
        </h2>
      </div>

      <div className="relative flex items-end justify-between mt-4">
        <div>
          <p className="text-xs opacity-70">Active Students</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 bg-white/10" />
          ) : (
            <p className="text-3xl font-bold tabular-nums">
              <AnimatedNumber value={activeStudents} />
            </p>
          )}
        </div>
        <Link
          href="/students"
          className="flex items-center gap-1 text-xs text-accent hover:underline"
        >
          Explore <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Mini Stat With Progress Bar ───────────────────────────────────────────

function MiniStatWithBar({
  label,
  value,
  total,
  suffix,
  color,
  isLoading,
}: {
  label: string;
  value: number;
  total: number;
  suffix?: string;
  color: string;
  isLoading?: boolean;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 w-12" />
          ) : (
            <p className="text-xl font-bold tabular-nums text-foreground">
              <AnimatedNumber value={value} />
              {suffix}
            </p>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn('h-full rounded-full animate-bar-grow', color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  formatValue?: (n: number) => string;
  icon: React.ElementType;
  sub?: string;
  isLoading?: boolean;
  href?: string;
  accent?: boolean;
}

function StatCard({
  label,
  value,
  formatValue,
  icon: Icon,
  sub,
  isLoading,
  href,
  accent,
}: StatCardProps) {
  const inner = (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5',
        accent && 'border-accent/60',
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tabular-nums text-foreground">
                <AnimatedNumber value={value} format={formatValue} />
              </p>
            )}
            {sub && !isLoading && (
              <p className="text-xs text-muted-foreground truncate">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              accent
                ? 'bg-accent-light text-accent-foreground'
                : 'bg-secondary text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {href && (
          <div className="mt-3 flex items-center gap-1 text-xxs text-muted-foreground">
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ─── Lead Pipeline Bars ────────────────────────────────────────────────────

function LeadPipelineBars({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).sort(([, a], [, b]) => b - a);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  const statusColors: Record<string, string> = {
    NEW: 'bg-accent',
    CONTACTED: 'bg-blue-500',
    COUNSELING_BOOKED: 'bg-purple-500',
    COUNSELING_ATTENDED: 'bg-indigo-500',
    QUALIFIED: 'bg-green-500',
    CONVERTED: 'bg-success',
    NOT_INTERESTED: 'bg-muted-foreground',
    LOST: 'bg-destructive',
    NO_SHOW: 'bg-orange-500',
    FOLLOW_UP: 'bg-cyan-500',
    INTERESTED: 'bg-teal-500',
  };

  return (
    <div className="space-y-3">
      {entries.map(([status, count]) => {
        const pct = (count / max) * 100;
        const color = statusColors[status] ?? 'bg-muted-foreground';
        return (
          <Link
            key={status}
            href={`/leads?status=${status}`}
            className="group block"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                {status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                <AnimatedNumber value={count} />
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full animate-bar-grow group-hover:opacity-80 transition-opacity',
                  color,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Status Row (small) ────────────────────────────────────────────────────

function StatusRow({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={cn('h-2 w-2 rounded-full', color)} />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">
        <AnimatedNumber value={count} />
      </span>
    </div>
  );
}

// ─── System Row ────────────────────────────────────────────────────────────

function SystemRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}