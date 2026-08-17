'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format, differenceInDays } from 'date-fns';
import {
  FileText,
  Wallet,
  ClipboardList,
  Bell,
  QrCode,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Files,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyStudentProfile } from '@/hooks/useStudents';
import { useMyInvoices, useMyPayments } from '@/hooks/useFinance';
import { useMyDocuments } from '@/hooks/useDocuments';
import { useOwnAttendance } from '@/hooks/useAttendance';
import { useMyJourney } from '@/hooks/useJourney';
import { useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { ROUTES } from '@/data/constants';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────

function formatNPRShort(amount: number): string {
  if (amount >= 10000000) return `Rs. ${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return `Rs. ${amount}`;
}

function get30DaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export default function StudentDashboardPage() {
  const { user } = useAuth();

  // ─── Data hooks ───
  const { data: student, isLoading: studentLoading } = useMyStudentProfile();
  const { data: invoices = [], isLoading: invoicesLoading } = useMyInvoices();
  const { data: payments = [], isLoading: paymentsLoading } = useMyPayments();
  const { data: documents = [], isLoading: docsLoading } = useMyDocuments();
  const { data: attendance = [], isLoading: attendanceLoading } = useOwnAttendance(
    get30DaysAgo(),
  );
  const { data: journey } = useMyJourney();
  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData } = useNotifications(1);

  if (!user) return null;

  const firstName = user.profile.firstName;

  // ─── Compute stats ───
  // Finances
  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const paidPct = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
  const duePct = totalInvoiced > 0 ? Math.round((totalDue / totalInvoiced) * 100) : 0;

  const overdueInvoices = invoices.filter(
    (inv) =>
      new Date(inv.dueDate) < new Date() &&
      inv.balanceAmount > 0 &&
      ['ISSUED', 'PARTIALLY_PAID'].includes(inv.status),
  );

  // Documents
  const docVerified = documents.filter(
    (d) => d.status === 'VERIFIED' || d.status === 'APPROVED',
  ).length;
  const docPending = documents.filter(
    (d) => d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW',
  ).length;
  const docRejected = documents.filter(
    (d) => d.status === 'REJECTED' || d.status === 'RESUBMISSION_REQUIRED',
  ).length;

  // Attendance
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const attendanceTotal = attendance.length;
  const attendanceRate =
    attendanceTotal > 0
      ? Math.round(((presentCount + lateCount) / attendanceTotal) * 100)
      : 0;

  // Journey (use CORRECT field names)
  const journeyProgress = journey?.overallProgress ?? 0;
  const currentMilestone = journey?.currentMilestone;
  const completedCount = journey?.completedCount ?? 0;
  const totalRequired = journey?.totalRequired ?? 0;

  // Notifications
  const unreadCount = unreadData?.count ?? 0;
  const recentNotifications = notificationsData?.items?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ROW 1 — HERO SECTION                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5 animate-fade-in-up">
        {/* Left: Welcome + Journey progress — 3 cols */}
        <div className="lg:col-span-3">
          <Card className="h-full border-0 bg-neutral-50/50 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Student Portal
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Journey Progress */}
              {journey ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Your Journey to Japan
                      </p>
                      <p className="text-xxs text-muted-foreground mt-0.5">
                        {completedCount} of {totalRequired} milestones completed
                      </p>
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-foreground">
                      <AnimatedNumber
                        value={journeyProgress}
                        format={(n) => `${n}%`}
                      />
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
                      style={{ width: `${journeyProgress}%` }}
                    />
                  </div>
                  {currentMilestone && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="text-muted-foreground">
                        Currently on:{' '}
                        <span className="font-medium text-foreground">
                          {currentMilestone.title}
                        </span>
                      </span>
                    </div>
                  )}
                  <Link
                    href="/my/journey"
                    className={buttonVariants({
                      variant: 'ghost',
                      size: 'sm',
                      className: 'mt-3 h-7 px-2 text-xs',
                    })}
                  >
                    View full journey
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-border bg-white p-4">
                  <p className="text-sm text-muted-foreground">
                    Your journey will be set up by your counselor soon.
                  </p>
                </div>
              )}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xxs uppercase tracking-widest opacity-80">
                Student ID
              </p>
              <p className="mt-1 text-xl font-bold font-mono tabular-nums">
                {studentLoading ? (
                  <Skeleton className="h-6 w-32 bg-white/20" />
                ) : (
                  student?.studentId ?? '—'
                )}
              </p>
              {student?.branch && (
                <p className="mt-1 text-xs opacity-90 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {student.branch.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ROW 2 — APPLICATION STATUS CARD (if exists)                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {student?.currentApplication && (
        <Card className="border-0 bg-neutral-50/50 shadow-sm animate-fade-in-up animate-delay-1">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
                  <FileText className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Your Application
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-foreground truncate">
                    {student.currentApplication.applicationNumber}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="accent" className="text-xxs">
                      {student.currentApplication.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              <Link
                href={ROUTES.MY_APPLICATION}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-white transition hover:bg-neutral-800"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ROW 3 — FEES + ATTENDANCE                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-in-up animate-delay-2">
        {/* Fees Summary */}
        <Card className="border-0 bg-neutral-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Fees Summary
            </CardTitle>
            <Link
              href={ROUTES.MY_FEES}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-white transition hover:bg-neutral-800"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {invoicesLoading || paymentsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : totalInvoiced === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No invoices yet.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-success">
                      <AnimatedNumber
                        value={totalPaid}
                        format={(n) => formatNPRShort(n)}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p
                      className={cn(
                        'mt-1 text-2xl font-bold tabular-nums',
                        totalDue > 0 ? 'text-destructive' : 'text-foreground',
                      )}
                    >
                      <AnimatedNumber
                        value={totalDue}
                        format={(n) => formatNPRShort(n)}
                      />
                    </p>
                  </div>
                </div>

                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full bg-success transition-all duration-1000"
                    style={{ width: `${paidPct}%` }}
                  />
                  <div
                    className="h-full bg-accent transition-all duration-1000"
                    style={{ width: `${duePct}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xxs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      <span className="text-muted-foreground">
                        {paidPct}% paid
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      <span className="text-muted-foreground">
                        {duePct}% due
                      </span>
                    </span>
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    Total {formatNPRShort(totalInvoiced)}
                  </span>
                </div>

                {overdueInvoices.length > 0 && (
                  <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive font-medium">
                      {overdueInvoices.length} overdue invoice
                      {overdueInvoices.length !== 1 ? 's' : ''} — please pay soon
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-0 bg-neutral-50/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Attendance
            </CardTitle>
            <Link
              href={ROUTES.MY_ATTENDANCE}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-white transition hover:bg-neutral-800"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : attendanceTotal === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No attendance recorded yet.
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                      <AnimatedNumber
                        value={attendanceRate}
                        format={(n) => `${n}%`}
                      />
                    </p>
                  </div>
                  <Badge
                    variant={
                      attendanceRate >= 90
                        ? 'success'
                        : attendanceRate >= 75
                          ? 'warning'
                          : 'destructive'
                    }
                    className="text-xxs"
                  >
                    {attendanceRate >= 90
                      ? 'Excellent'
                      : attendanceRate >= 75
                        ? 'Good'
                        : 'Needs Improvement'}
                  </Badge>
                </div>

                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full bg-success transition-all duration-1000"
                    style={{
                      width: `${(presentCount / attendanceTotal) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-warning transition-all duration-1000"
                    style={{
                      width: `${(lateCount / attendanceTotal) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-destructive transition-all duration-1000"
                    style={{
                      width: `${(absentCount / attendanceTotal) * 100}%`,
                    }}
                  />
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-xxs">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">
                      {presentCount} Present
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-muted-foreground">
                      {lateCount} Late
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">
                      {absentCount} Absent
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ROW 4 — QUICK KPIs                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-fade-in-up animate-delay-3">
        <QuickKpi
          icon={Files}
          label="Documents"
          value={documents.length}
          sub={
            documents.length > 0
              ? `${docVerified} verified`
              : 'None uploaded yet'
          }
          href={ROUTES.MY_DOCUMENTS}
          isLoading={docsLoading}
        />
        <QuickKpi
          icon={CheckCircle2}
          label="Payments Made"
          value={payments.filter((p) => p.status === 'COMPLETED').length}
          sub={`${formatNPRShort(totalPaid)} total`}
          href={ROUTES.MY_FEES}
          isLoading={paymentsLoading}
          accent="success"
        />
        <QuickKpi
          icon={Bell}
          label="Unread Alerts"
          value={unreadCount}
          sub={unreadCount > 0 ? 'Tap to view' : 'All caught up ✓'}
          href={ROUTES.MY_NOTIFICATIONS}
          accent={unreadCount > 0 ? 'accent' : undefined}
        />
        <QuickKpi
          icon={Sparkles}
          label="Days Enrolled"
          value={
            student?.admissionDate
              ? differenceInDays(new Date(), new Date(student.admissionDate))
              : 0
          }
          sub={
            student?.admissionDate
              ? `Since ${format(new Date(student.admissionDate), 'MMM yyyy')}`
              : undefined
          }
          isLoading={studentLoading}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ROW 5 — DOCUMENTS + COUNSELOR + QR                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-3 animate-fade-in-up animate-delay-4">
        {/* Documents status */}
        <Card className="border-0 bg-neutral-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Files className="h-4 w-4" />
              Document Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : documents.length === 0 ? (
              <div className="py-6 text-center">
                <Files className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">
                  No documents uploaded yet.
                </p>
                <Link
                  href={ROUTES.MY_DOCUMENTS}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className: 'mt-3',
                  })}
                >
                  Upload Documents
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {docVerified > 0 && (
                  <StatusPill
                    color="bg-success"
                    label="Verified"
                    count={docVerified}
                  />
                )}
                {docPending > 0 && (
                  <StatusPill
                    color="bg-warning"
                    label="Under Review"
                    count={docPending}
                  />
                )}
                {docRejected > 0 && (
                  <StatusPill
                    color="bg-destructive"
                    label="Needs Action"
                    count={docRejected}
                  />
                )}
                <Link
                  href={ROUTES.MY_DOCUMENTS}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className: 'w-full mt-2',
                  })}
                >
                  Manage Documents
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Counselor Card */}
        <Card className="border-0 bg-neutral-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Your Counselor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : student?.assignedCounselor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent-foreground font-bold text-sm">
                    {student.assignedCounselor.firstName[0]}
                    {student.assignedCounselor.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {student.assignedCounselor.firstName}{' '}
                      {student.assignedCounselor.lastName}
                    </p>
                    <p className="text-xxs text-muted-foreground truncate">
                      {student.assignedCounselor.email}
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${student.assignedCounselor.email}`}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className: 'w-full',
                  })}
                >
                  Contact
                </a>
              </div>
            ) : (
              <div className="py-6 text-center">
                <UserCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">
                  No counselor assigned yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Card */}
        <Card className="border-0 bg-gradient-to-br from-foreground to-neutral-800 text-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <QrCode className="h-4 w-4" />
              Attendance QR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-lg bg-white p-2">
                <QrCode className="h-full w-full text-foreground" />
              </div>
              <p className="text-xs text-white/70 text-center">
                Show this QR to your teacher for attendance
              </p>
              <Link
                href={ROUTES.MY_QR}
                className={buttonVariants({
                  variant: 'accent',
                  size: 'sm',
                  className: 'w-full',
                })}
              >
                Show Full QR
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  ROW 6 — RECENT NOTIFICATIONS                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {recentNotifications.length > 0 && (
        <Card className="border-0 bg-neutral-50/50 shadow-sm animate-fade-in-up animate-delay-5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Notifications
            </CardTitle>
            <Link
              href={ROUTES.MY_NOTIFICATIONS}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-white transition hover:bg-neutral-800"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    n.readAt
                      ? 'border-border bg-white'
                      : 'border-accent/30 bg-accent-light/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      n.readAt
                        ? 'bg-secondary text-muted-foreground'
                        : 'bg-accent text-accent-foreground',
                    )}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-xxs text-muted-foreground">
                      {format(new Date(n.createdAt), 'MMM dd · hh:mm a')}
                    </p>
                  </div>
                  {!n.readAt && (
                    <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function QuickKpi({
  icon: Icon,
  label,
  value,
  sub,
  href,
  isLoading,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  href?: string;
  isLoading?: boolean;
  accent?: 'accent' | 'success';
}) {
  const inner = (
    <Card
      className={cn(
        'transition-all hover:shadow-md hover:-translate-y-0.5 border-0 bg-neutral-50/50 shadow-sm',
        accent === 'accent' && 'ring-2 ring-accent/40',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              accent === 'accent'
                ? 'bg-accent text-accent-foreground'
                : accent === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-white text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          {href && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
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
          {sub && !isLoading && (
            <p className="text-xxs text-muted-foreground truncate mt-0.5">
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

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