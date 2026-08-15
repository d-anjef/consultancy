'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  User as UserIcon,
  Zap,
  ArrowRight,
  XCircle,
  CheckCircle2,
  History,
} from 'lucide-react';
import {
  useApplication,
  useApplicationHistory,
} from '@/hooks/useApplications';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import { ApplicationStatusTransitionDialog } from '@/components/applications/ApplicationStatusTransitionDialog';
import { CancelApplicationDialog } from '@/components/applications/CancelApplicationDialog';
import { QuickCompleteDialog } from '@/components/applications/QuickCompleteDialog'

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [quickCompleteOpen, setQuickCompleteOpen] = useState(false);

  const { data: app, isLoading } = useApplication(id);
  const { data: history = [] } = useApplicationHistory(id);

  const canChangeStatus = has(PERMISSION_CODES.CHANGE_APPLICATION_STATUS);
  const canCancel = has(PERMISSION_CODES.CANCEL_APPLICATION);

  if (isLoading) return <LoadingState fullPage message="Loading application…" />;

  if (!app) {
    return (
      <EmptyState
        icon={FileText}
        title="Application not found"
        action={
          <Button variant="outline" onClick={() => router.push('/applications')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  const isTerminal = ['APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(app.status);
  const isCancelled = app.status === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/applications')}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Applications
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {app.program.name}
            </h1>
            <ApplicationStatusBadge status={app.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {app.applicationNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canChangeStatus && !isTerminal && (
            <>
              <Button
                variant="accent"
                onClick={() => setQuickCompleteOpen(true)}
                title="Fast-track to Approved"
              >
                <Zap className="h-4 w-4" />
                Quick Complete
              </Button>
              <Button variant="outline" onClick={() => setTransitionOpen(true)}>
                <ArrowRight className="h-4 w-4" />
                Change Status
              </Button>
            </>
          )}
          {canCancel && !isTerminal && (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => router.push(`/students/${app.student.id}`)}
                className="text-left group"
              >
                <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                  {app.student.firstName} {app.student.lastName}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {app.student.studentId}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {app.student.phone} · {app.student.email}
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Program + Visa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Program">{app.program.name}</InfoField>
              <InfoField label="Visa Category">{app.visaCategory.name}</InfoField>
              <InfoField label="School / Company">{app.schoolOrCompany.name}</InfoField>
              <InfoField label="Country">{app.schoolOrCompany.country}</InfoField>
              <InfoField label="Intake Year">{app.intake.year}</InfoField>
              <InfoField label="Session">{app.intake.session || '—'}</InfoField>
            </CardContent>
          </Card>

          {/* Timeline / History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              ) : (
                <ol className="relative border-l-2 border-border ml-3 space-y-4">
                  {history.map((h) => (
                    <li key={h.id} className="ml-4">
                      <span className="absolute -left-[7px] flex h-3 w-3 items-center justify-center rounded-full bg-yellow-400 ring-4 ring-background" />
                      <div className="text-sm">
                        <span className="font-medium text-foreground">
                          {h.fromStatus ? `${h.fromStatus} → ` : ''}
                          {h.toStatus}
                        </span>
                        {h.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">
                            "{h.reason}"
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {h.changedBy?.name || h.changedBy?.email} ·{' '}
                        {format(new Date(h.changedAt), 'MMM dd, yyyy h:mm a')}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {app.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{app.notes}</p>
              </CardContent>
            </Card>
          )}

          {(app.rejectionReason || app.cancellationReason) && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  {app.rejectionReason ? 'Rejection Reason' : 'Cancellation Reason'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">
                  {app.rejectionReason || app.cancellationReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Counselor</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium text-foreground">
                {app.assignedCounselor.firstName} {app.assignedCounselor.lastName}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {app.assignedCounselor.email}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{app.branch.name}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoField label="Created">
                {format(new Date(app.createdAt), 'PPP')}
              </InfoField>
              {app.submittedAt && (
                <InfoField label="Submitted">
                  {format(new Date(app.submittedAt), 'PPP')}
                </InfoField>
              )}
              {app.approvedAt && (
                <InfoField label="Approved">
                  <span className="text-green-600 font-medium">
                    {format(new Date(app.approvedAt), 'PPP')}
                  </span>
                </InfoField>
              )}
              {app.completedAt && (
                <InfoField label="Completed">
                  <span className="text-green-600 font-medium">
                    {format(new Date(app.completedAt), 'PPP')}
                  </span>
                </InfoField>
              )}
              {app.rejectedAt && (
                <InfoField label="Rejected">
                  <span className="text-destructive">
                    {format(new Date(app.rejectedAt), 'PPP')}
                  </span>
                </InfoField>
              )}
              {app.cancelledAt && (
                <InfoField label="Cancelled">
                  <span className="text-muted-foreground">
                    {format(new Date(app.cancelledAt), 'PPP')}
                  </span>
                </InfoField>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ApplicationStatusTransitionDialog
        application={app}
        open={transitionOpen}
        onOpenChange={setTransitionOpen}
      />

      <CancelApplicationDialog
        application={app}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      <QuickCompleteDialog
        application={app}
        open={quickCompleteOpen}
        onOpenChange={setQuickCompleteOpen}
      />
    </div>
  );
}

function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}