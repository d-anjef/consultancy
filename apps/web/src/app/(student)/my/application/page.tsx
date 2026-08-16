
'use client';

import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useMyStudentProfile } from '@/hooks/useStudents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'REGISTERED', label: 'Registered' },
  { key: 'DOCUMENT_COLLECTION', label: 'Document Collection' },
  { key: 'DOCUMENT_REVIEW', label: 'Document Review' },
  { key: 'DOCUMENT_VERIFICATION', label: 'Document Verification' },
  { key: 'FINAL_APPROVAL', label: 'Final Approval' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'COMPLETED', label: 'Completed' },
];

const TERMINAL_ERROR_STATUSES = new Set([
  'REJECTED',
  'CANCELLED',
  'ADDITIONAL_DOCUMENT_REQUIRED',
]);

export default function MyApplicationPage() {
  const { data: student, isLoading } = useMyStudentProfile();

  if (isLoading) {
    return <LoadingState fullPage message="Loading your application…" />;
  }

  if (!student) {
    return (
      <EmptyState
        icon={FileText}
        title="Profile not found"
        description="We couldn't find your student profile. Please contact your counselor."
      />
    );
  }

  const app = student.currentApplication;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Student Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          My Application
        </h1>
      </div>

      {!app ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No application yet"
            description="You don't have an application on file yet. Contact your counselor to get started."
          />
        </Card>
      ) : (
        <ApplicationDetail app={app} student={student} />
      )}
    </div>
  );
}

function ApplicationDetail({
  app,
  student,
}: {
  app: { id: string; applicationNumber: string; status: string };
  student: import('@/lib/api/students').Student;
}) {
  const status = app.status as import('@/lib/api/applications').ApplicationStatus;
  const isErrorStatus = TERMINAL_ERROR_STATUSES.has(status);
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Application
                </h2>
                <ApplicationStatusBadge status={status} />
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {app.applicationNumber}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <InfoRow icon={User} label="Student">
            {student.personal.firstName} {student.personal.lastName}
          </InfoRow>
          <InfoRow icon={Building2} label="Branch">
            {student.branch.name}
          </InfoRow>
          {student.assignedCounselor && (
            <InfoRow icon={User} label="Your Counselor">
              {student.assignedCounselor.firstName} {student.assignedCounselor.lastName}
            </InfoRow>
          )}
          <InfoRow icon={Clock} label="Admission Date">
            {format(new Date(student.admissionDate), 'PPP')}
          </InfoRow>
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      {!isErrorStatus && currentStepIndex >= 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={
                        'flex h-7 w-7 items-center justify-center rounded-full shrink-0 ' +
                        (isDone
                          ? 'bg-success text-white'
                          : isCurrent
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground')
                      }
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xxs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          'text-sm ' +
                          (isCurrent
                            ? 'font-semibold text-foreground'
                            : isDone
                            ? 'text-foreground'
                            : 'text-muted-foreground')
                        }
                      >
                        {step.label}
                      </p>
                    </div>
                    {isCurrent && (
                      <Badge variant="accent" className="text-xxs">
                        Current
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isErrorStatus && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              {status === 'REJECTED' && <XCircle className="h-4 w-4" />}
              {status === 'CANCELLED' && <XCircle className="h-4 w-4" />}
              {status === 'ADDITIONAL_DOCUMENT_REQUIRED' && (
                <AlertCircle className="h-4 w-4" />
              )}
              {status === 'REJECTED' && 'Application Rejected'}
              {status === 'CANCELLED' && 'Application Cancelled'}
              {status === 'ADDITIONAL_DOCUMENT_REQUIRED' &&
                'Additional Documents Required'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">
              Please contact your counselor for next steps.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info banner */}
      <Card className="border-accent/30 bg-accent-light">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <p className="font-medium">Need more information?</p>
            <p className="mt-1 text-muted-foreground">
              For detailed application information including school, intake dates, and
              deadlines, please contact your assigned counselor.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}