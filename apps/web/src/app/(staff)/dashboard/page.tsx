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
  Building2,
  ArrowRight,
  Search,
  Bell,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

function formatCurrencyShort(amount: number) {
  if (amount >= 10000000) return `Rs. ${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return `Rs. ${amount}`;
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

  // Collection metrics for the split-progress-bar (like reference)
  const totalPaid = financeStats?.totalPaid ?? 0;
  const totalOutstanding = financeStats?.totalOutstanding ?? 0;
  const totalInvoiced = financeStats?.totalInvoiced ?? 0;
  const paidPct =
    totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
  const outstandingPct =
    totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 100) : 0;

  // Convert rate for lead card
  const conversionRate =
    leadStats && leadStats.total > 0
      ? Math.round(((leadStats.byStatus?.CONVERTED ?? 0) / leadStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ROW 1 — HERO SECTION (financial split-bar + hero image)            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5 animate-fade-in-up animate-delay-0">
        {/* Left: Financial split bar (like Apartments Sold/Rented) — 3 cols */}
        <div className="lg:col-span-3">
          <Card className="h-full border-0 bg-neutral-50/50 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {user.branch?.name ?? 'Organization'}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Welcome back, {firstName} 👋
                </h1>
              </div>

              {/* Two financial numbers side-by-side */}
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                  {financeLoading ? (
                    <Skeleton className="mt-1 h-9 w-32" />
                  ) : (
                    <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                      <AnimatedNumber
                        value={totalPaid}
                        format={(n) => formatCurrencyShort(n)}
                      />
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  {financeLoading ? (
                    <Skeleton className="mt-1 h-9 w-32" />
                  ) : (
                    <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                      <AnimatedNumber
                        value={totalOutstanding}
                        format={(n) => formatCurrencyShort(n)}
                      />
                    </p>
                  )}
                </div>
              </div>

              {/* Split progress bar — black + orange + track */}
              <div className="mt-6 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full bg-foreground transition-all duration-1000 ease-out"
                  style={{ width: `${paidPct}%` }}
                  title={`Collected: ${paidPct}%`}
                />
                <div
                  className="h-full bg-accent transition-all duration-1000 ease-out"
                  style={{ width: `${outstandingPct}%` }}
                  title={`Outstanding: ${outstandingPct}%`}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xxs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-foreground" />
                    <span className="text-muted-foreground">
                      Collected {paidPct}%
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-muted-foreground">
                      Outstanding {outstandingPct}%
                    </span>
                  </span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  {formatCurrencyShort(totalInvoiced)} total
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Hero image — 2 cols */}
        <div className="lg:col-span-2">
          <div className="relative h-full min-h-[220px] overflow-hidden rounded-2xl">
            <Image
              src="/images/hero.png"
              alt="Journey to Japan"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xxs uppercase tracking-widest opacity-80">
                Journey to Japan
              </p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-lg font-bold leading-tight">
                  Active Students
                </p>
                <Link
                  href="/students"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground transition hover:bg-white"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
                {studentStatsLoading ? (
                  <Skeleton className="h-8 w-16 bg-white/20" />
                ) : (
                  <p className="mt-1 text-3xl font-bold tabular-nums">
                  <AnimatedNumber
                    value={
                      studentStats?.byStatus?.ACTIVE ??
                      overview?.activeStudents ??
                      0
                    }
                  />
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ROW 2 — TWO BIG NUMBER CARDS + LEAD PIPELINE (mini bar chart)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column: two stacked stat cards — 2 cols */}
        <div className="grid gap-4 lg:col-span-2">
          <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
            <div className="animate-fade-in-up animate-delay-1">
              <BigStatCard
                label="Total Leads"
                value={overview?.totalLeads ?? 0}
                sub={`${conversionRate}% converted`}
                barcode
                isLoading={overviewLoading}
                href="/leads"
              />
            </div>
          </PermissionGuard>

          <PermissionGuard requires={[PERMISSION_CODES.VIEW_STUDENT]}>
            <div className="animate-fade-in-up animate-delay-2">
              <BigStatCard
                label="Total Enrolled"
                value={overview?.totalStudents ?? 0}
                sub="All time"
                barcode
                isLoading={overviewLoading}
                href="/students"
              />
            </div>
          </PermissionGuard>
        </div>

        {/* Right: Lead Pipeline (like the horizontal bars in reference) — 3 cols */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
          <div className="lg:col-span-3 animate-fade-in-up animate-delay-3">
            <Card className="h-full border-0 bg-neutral-50/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Lead Pipeline</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Distribution by status
                  </p>
                </div>
                <Link
                  href="/leads"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-white transition hover:bg-neutral-800"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="pt-2">
                {leadStatsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : leadStats && Object.keys(leadStats.byStatus).length > 0 ? (
                  <LeadPipelineChart byStatus={leadStats.byStatus} />
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No leads yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ROW 3 — QUICK KPIs                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-fade-in-up animate-delay-4">
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_APPLICATION]}>
          <QuickKpi
            icon={FileText}
            label="Applications"
            value={overview?.totalApplications ?? 0}
            isLoading={overviewLoading}
            href="/applications"
          />
        </PermissionGuard>

        <PermissionGuard requires={[PERMISSION_CODES.VIEW_STUDENT]}>
          <QuickKpi
            icon={Users}
            label="Active Students"
            value={studentStats?.byStatus?.ACTIVE ?? 0}
            isLoading={studentStatsLoading}
            href="/students"
          />
        </PermissionGuard>

        <PermissionGuard requires={[PERMISSION_CODES.VIEW_LEAD]}>
          <QuickKpi
            icon={UserPlus}
            label="New Leads"
            value={leadStats?.byStatus?.NEW ?? 0}
            isLoading={leadStatsLoading}
            href="/leads?status=NEW"
          />
        </PermissionGuard>

        <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
          <QuickKpi
            icon={Wallet}
            label="Overdue"
            value={financeStats?.overdueCount ?? 0}
            isLoading={financeLoading}
            href="/finance?overdue=true"
            accent={!!financeStats?.overdueCount}
          />
        </PermissionGuard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ROW 4 — TODAY / DOCUMENTS / SYSTEM                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Counseling */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_COUNSELING]}>
          <div className="animate-fade-in-up animate-delay-5">
            <Card className="h-full border-0 bg-neutral-50/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4" />
                  Today's Sessions
                </CardTitle>
                <Badge variant="secondary" className="rounded-full">
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
                        className="flex items-center gap-3 rounded-xl bg-white p-3 transition-all hover:shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light">
                          <span className="text-xxs font-bold text-accent-foreground">
                            {session.scheduledDate
                              ? new Date(session.scheduledDate).toLocaleTimeString(
                                  'en-US',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )
                              : '—'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">
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

        {/* Documents */}
        <PermissionGuard
          requireAny={[
            PERMISSION_CODES.VERIFY_DOCUMENT,
            PERMISSION_CODES.FINAL_APPROVE_DOCUMENT,
          ]}
        >
          <div className="animate-fade-in-up animate-delay-6">
            <Card className="h-full border-0 bg-neutral-50/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4" />
                  Documents
                </CardTitle>
                <Badge
                  variant={pendingDocCount > 0 ? 'warning' : 'secondary'}
                  className="rounded-full"
                >
                  {docLoading ? '…' : pendingDocCount}
                </Badge>
              </CardHeader>
              <CardContent>
                {docLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : pendingDocCount === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                      <ClipboardCheck className="h-5 w-5 text-success" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      All caught up ✓
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(docStats?.byStatus?.SUBMITTED ?? 0) > 0 && (
                      <StatusPill
                        color="bg-blue-500"
                        label="Awaiting Review"
                        count={docStats?.byStatus?.SUBMITTED ?? 0}
                      />
                    )}
                    {(docStats?.byStatus?.UNDER_REVIEW ?? 0) > 0 && (
                      <StatusPill
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
                        className: 'w-full mt-2 rounded-full',
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

        {/* System / Overdue */}
        <PermissionGuard requires={[PERMISSION_CODES.VIEW_FINANCE]}>
          <div className="animate-fade-in-up animate-delay-7">
            {(financeStats?.overdueCount ?? 0) > 0 ? (
              <Card className="h-full border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold tabular-nums text-destructive">
                    <AnimatedNumber
                      value={financeStats?.overdueAmount ?? 0}
                      format={(n) => formatCurrencyShort(n)}
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
                      className: 'w-full mt-3 rounded-full',
                    })}
                  >
                    View Overdue
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-0 bg-neutral-50/50 shadow-sm">
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
                    <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
                      {financeLoading ? (
                        <Skeleton className="h-8 w-24 mx-auto" />
                      ) : (
                        <AnimatedNumber
                          value={paidPct}
                          format={(n) => `${n}%`}
                        />
                      )}
                    </p>
                    <p className="text-xxs text-muted-foreground">
                      collection rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </PermissionGuard>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  ROW 5 — SYSTEM OVERVIEW (SA only)                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <PermissionGuard requires={[PERMISSION_CODES.VIEW_HEALTH]}>
        <div className="animate-fade-in-up animate-delay-7">
          <Card className="border-0 bg-neutral-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SystemStat label="Your Role" value={user.role.displayName} />
                <SystemStat
                  label="Permissions"
                  value={user.role.permissions.length}
                />
                <SystemStat
                  label="Revenue Collected"
                  value={
                    financeStats ? formatCurrencyShort(financeStats.totalPaid) : '—'
                  }
                />
                <div className="space-y-1">
                  <p className="text-xxs uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <Badge variant="success" className="rounded-full">
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-soft-pulse" />
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Big Stat Card (with barcode) ─────────────────────────────────────────

function BigStatCard({
  label,
  value,
  sub,
  barcode,
  isLoading,
  href,
  formatValue,
}: {
  label: string;
  value: number;
  sub?: string;
  barcode?: boolean;
  isLoading?: boolean;
  href?: string;
  formatValue?: (n: number) => string;
}) {
  const inner = (
    <Card className="relative h-full overflow-hidden border-0 bg-neutral-50/50 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {isLoading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
            <AnimatedNumber value={value} format={formatValue} />
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          {sub && (
            <p className="text-xxs text-muted-foreground">{sub}</p>
          )}
          {barcode && <BarcodeChart />}
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ─── Barcode-style chart (decorative but functional) ──────────────────────

function BarcodeChart() {
  // Generate consistent "chart" bars — random but stable
  const bars = [
    2, 8, 4, 12, 6, 3, 10, 5, 14, 7, 2, 9, 4, 11, 6, 3, 8, 5, 12,
  ];
  return (
    <div className="flex h-8 items-end gap-[2px]">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[2px] bg-foreground/70 rounded-sm"
          style={{ height: `${h * 2}px` }}
        />
      ))}
    </div>
  );
}

// ─── Quick KPI Card ────────────────────────────────────────────────────────

function QuickKpi({
  icon: Icon,
  label,
  value,
  isLoading,
  href,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  isLoading?: boolean;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <Card
      className={cn(
        'transition-all hover:shadow-md hover:-translate-y-0.5 border-0 bg-neutral-50/50 shadow-sm',
        accent && 'ring-2 ring-accent/40',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              accent
                ? 'bg-accent text-accent-foreground'
                : 'bg-white text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold tabular-nums text-foreground">
              <AnimatedNumber value={value} />
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Lead Pipeline Horizontal Bar Chart ───────────────────────────────────

function LeadPipelineChart({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const max = Math.max(...entries.map(([, v]) => v), 1);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-4">
      {entries.map(([status, count]) => {
        const pct = (count / max) * 100;
        const sharePct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <Link
            key={status}
            href={`/leads?status=${status}`}
            className="group block"
          >
            <div className="flex items-center gap-3">
              {/* Label */}
              <div className="w-24 shrink-0">
                <p className="text-xxs font-medium uppercase tracking-wider text-foreground truncate">
                  {status.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Bar */}
              <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-1000 ease-out group-hover:opacity-80"
                  style={{ width: `${pct}%` }}
                />
                {/* Percentage badge inside bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-foreground px-2 py-0.5 text-xxs font-bold text-white"
                  style={{
                    left: `calc(${pct}% - 30px)`,
                    minWidth: '30px',
                    textAlign: 'center',
                  }}
                >
                  {sharePct}%
                </div>
              </div>

              {/* Count */}
              <div className="w-10 shrink-0 text-right">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  <AnimatedNumber value={count} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Status Pill (for Documents section) ──────────────────────────────────

function StatusPill({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-full bg-white px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className={cn('h-2 w-2 rounded-full', color)} />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums">
        <AnimatedNumber value={count} />
      </span>
    </div>
  );
}

// ─── System Stat ──────────────────────────────────────────────────────────

function SystemStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xxs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}