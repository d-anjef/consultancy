'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  XCircle,
  FileText,
  User,
  Building2,
  Calendar,
  History as HistoryIcon,
} from 'lucide-react';
import { useApplication, useApplicationHistory } from '@/hooks/useApplications';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ApplicationStatusBadge,
  APPLICATION_STATUS_LABELS,
} from '@/components/applications/ApplicationStatusBadge';
import { ApplicationStatusTransitionDialog } from '@/components/applications/ApplicationStatusTransitionDialog';
import { CancelApplicationDialog } from '@/components/applications/CancelApplicationDialog';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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
        description="This application doesn't exist or you don't have permission to view it."
        action={
          <Button variant="outline" onClick={() => router.push('/applications')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
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
              {app.applicationNumber}
            </h1>
            <ApplicationStatusBadge status={app.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.student.firstName} {app.student.lastName} · {app.student.studentId}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {canChangeStatus && app.isActive && (
            <Button variant="accent" onClick={() => setTransitionOpen(true)}>
              <ArrowRight className="h-4 w-4" />
              Change Status
            </Button>
          )}
          {canCancel && app.isActive && (
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
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Visa Category">{app.visaCategory.name}</InfoField>
              <InfoField label="Program">{app.program.name}</InfoField>
              <InfoField label="School / Company">
                {app.schoolOrCompany.name}
              </InfoField>
              <InfoField label="Country">{app.schoolOrCompany.country}</InfoField>
              <InfoField label="Intake Year">{app.intake.year}</InfoField>
              {app.intake.session && (
                <InfoField label="Session">{app.intake.session}</InfoField>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No history yet.
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
                  <ul className="space-y-4">
                    {history.map((h) => (
                      <li key={h.id} className="relative">
                        <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
                        <div className="text-sm font-medium text-foreground">
                          {h.fromStatus
                            ? `${APPLICATION_STATUS_LABELS[h.fromStatus as keyof typeof APPLICATION_STATUS_LABELS] ?? h.fromStatus} → ${APPLICATION_STATUS_LABELS[h.toStatus as keyof typeof APPLICATION_STATUS_LABELS] ?? h.toStatus}`
                            : APPLICATION_STATUS_LABELS[h.toStatus as keyof typeof APPLICATION_STATUS_LABELS] ?? h.toStatus}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {h.changedBy.name ?? h.changedBy.email ?? 'Unknown'} ·{' '}
                          {format(new Date(h.changedAt), 'PPP p')}
                        </div>
                        {h.reason && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            "{h.reason}"
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {app.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {app.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <button
                onClick={() => router.push(`/students/${app.student.id}`)}
                className="text-accent hover:underline font-medium"
              >
                {app.student.studentId}
              </button>
              <div className="text-foreground">
                {app.student.firstName} {app.student.lastName}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {app.student.phone}
              </div>
              <div className="text-xs text-muted-foreground">
                {app.student.email}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Counselor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium text-foreground">
                {app.assignedCounselor.firstName} {app.assignedCounselor.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
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

          {app.deadlines && Object.values(app.deadlines).some(Boolean) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {app.deadlines.documentSubmission && (
                  <InfoField label="Documents">
                    {format(new Date(app.deadlines.documentSubmission), 'PPP')}
                  </InfoField>
                )}
                {app.deadlines.applicationSubmission && (
                  <InfoField label="Submission">
                    {format(new Date(app.deadlines.applicationSubmission), 'PPP')}
                  </InfoField>
                )}
                {app.deadlines.result && (
                  <InfoField label="Result">
                    {format(new Date(app.deadlines.result), 'PPP')}
                  </InfoField>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}