'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarClock,
  User,
  Building2,
  UserCircle,
  RotateCcw,
  XCircle,
  CheckCircle2,
  History,
} from 'lucide-react';
import { useCounseling } from '@/hooks/useCounseling';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CounselingStatusBadge, CounselingOutcomeBadge } from '@/components/counseling/CounselingStatusBadge';
import { RescheduleCounselingDialog } from '@/components/counseling/RescheduleCounselingDialog';
import { CancelCounselingDialog } from '@/components/counseling/CancelCounselingDialog';
import { RecordOutcomeDialog } from '@/components/counseling/RecordOutcomeDialog';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

export default function CounselingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);

  const { data: session, isLoading } = useCounseling(id);

  const canEdit = has(PERMISSION_CODES.EDIT_COUNSELING);
  const canCancel = has(PERMISSION_CODES.CANCEL_COUNSELING);
  const canRecordOutcome = has(PERMISSION_CODES.RECORD_COUNSELING_OUTCOME);

  if (isLoading) return <LoadingState fullPage message="Loading session…" />;

  if (!session) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Session not found"
        description="This counseling session doesn't exist or you don't have permission to view it."
        action={
          <Button variant="outline" onClick={() => router.push('/counseling')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  const isActionable = session.status === 'BOOKED' || session.status === 'RESCHEDULED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/counseling')}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Counseling
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {session.lead.firstName} {session.lead.lastName}
            </h1>
            <CounselingStatusBadge status={session.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {session.counselingNumber}
          </p>
        </div>

        {isActionable && (
          <div className="flex gap-2 shrink-0">
            {canEdit && (
              <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
                <RotateCcw className="h-4 w-4" />
                Reschedule
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
            {canRecordOutcome && (
              <Button variant="accent" onClick={() => setOutcomeOpen(true)}>
                <CheckCircle2 className="h-4 w-4" />
                Record Outcome
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Date & Time
              </div>
              <div className="text-foreground">
                {format(new Date(session.scheduledDate), 'EEEE, MMMM dd, yyyy')}
                {' at '}
                <span className="font-mono">{session.scheduledTime}</span>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Duration
              </div>
              <div className="text-foreground">
                {session.durationMinutes} minutes
              </div>
            </div>
            {session.attendedAt && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Attended At
                </div>
                <div className="text-foreground">
                  {format(new Date(session.attendedAt), 'PPP p')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Counselor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Counselor
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium text-foreground">
              {session.counselor.firstName} {session.counselor.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {session.counselor.email}
            </div>
          </CardContent>
        </Card>

        {/* Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <button
              onClick={() => router.push(`/leads/${session.lead.id}`)}
              className="text-accent hover:underline font-medium"
            >
              {session.lead.leadNumber}
            </button>
            <div className="text-foreground">
              {session.lead.firstName} {session.lead.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              Status: {session.lead.status}
            </div>
          </CardContent>
        </Card>

        {/* Branch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Branch
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {session.branch.name}
          </CardContent>
        </Card>

        {/* Outcome */}
        {session.outcome && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {session.outcome.result && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Result
                  </span>
                  <CounselingOutcomeBadge result={session.outcome.result} />
                </div>
              )}
              {session.outcome.notes && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Notes
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">
                    {session.outcome.notes}
                  </p>
                </div>
              )}
              {session.outcome.nextSteps && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Next Steps
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">
                    {session.outcome.nextSteps}
                  </p>
                </div>
              )}
              {session.followUpDate && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Follow-up Date
                  </div>
                  <div className="text-foreground">
                    {format(new Date(session.followUpDate), 'PPP')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancellation */}
        {session.status === 'CANCELLED' && session.cancellationReason && (
          <Card className="lg:col-span-2 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="text-foreground whitespace-pre-wrap">
                {session.cancellationReason}
              </div>
              {session.cancelledAt && (
                <div className="text-xs text-muted-foreground mt-2">
                  Cancelled on {format(new Date(session.cancelledAt), 'PPP p')}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <RescheduleCounselingDialog
        session={session}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
      />

      <CancelCounselingDialog
        session={session}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      <RecordOutcomeDialog
        session={session}
        open={outcomeOpen}
        onOpenChange={setOutcomeOpen}
      />
    </div>
  );
}