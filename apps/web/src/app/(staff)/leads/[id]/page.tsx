'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  UserCheck,
  ArrowRight,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
  Building2,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { useLead } from '@/hooks/useLeads';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { LeadSourceBadge } from '@/components/leads/LeadSourceBadge';
import { LeadTimeline } from '@/components/leads/LeadTimeline';
import { AssignCounselorDialog } from '@/components/leads/AssignCounselorDialog';
import { LeadStatusTransitionDialog } from '@/components/leads/LeadStatusTransitionDialog';
import { ScheduleCounselingDialog } from '@/components/counseling/ScheduleCounselingDialog';
import { CreateStudentDialog } from '@/components/students/CreateStudentDialog';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [assignOpen, setAssignOpen] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const { data: lead, isLoading } = useLead(id);

  if (isLoading) return <LoadingState fullPage message="Loading lead…" />;

  if (!lead) {
    return (
      <EmptyState
        icon={FileText}
        title="Lead not found"
        description="The lead you're looking for doesn't exist or you don't have permission to view it."
        action={
          <Button variant="outline" onClick={() => router.push('/leads')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Leads
          </Button>
        }
      />
    );
  }

  const canAssign = has(PERMISSION_CODES.ASSIGN_LEAD);
  const canEdit = has(PERMISSION_CODES.EDIT_LEAD);
  const canScheduleCounseling = has(PERMISSION_CODES.CREATE_COUNSELING);
  const canCreateStudent = has(PERMISSION_CODES.CREATE_STUDENT);

  // Show "Convert to Student" only if:
  // - User has permission
  // - Lead is NOT already converted
  // - Lead is in a status where conversion makes sense
  const canShowConvertButton =
    canCreateStudent &&
    !lead.convertedToStudent &&
    (lead.status === 'QUALIFIED' ||
      lead.status === 'INTERESTED' ||
      lead.status === 'COUNSELING_ATTENDED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/leads')}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Leads
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {lead.personal.firstName} {lead.personal.lastName}
            </h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {lead.leadNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canAssign && !lead.convertedToStudent && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <UserCheck className="h-4 w-4" />
              {lead.assignedCounselor ? 'Reassign' : 'Assign'}
            </Button>
          )}
          {canEdit && !lead.convertedToStudent && (
            <Button variant="outline" onClick={() => setTransitionOpen(true)}>
              <ArrowRight className="h-4 w-4" />
              Change Status
            </Button>
          )}
          {canScheduleCounseling && !lead.convertedToStudent && (
            <Button variant="outline" onClick={() => setScheduleOpen(true)}>
              <Calendar className="h-4 w-4" />
              Schedule Counseling
            </Button>
          )}
          {canShowConvertButton && (
            <Button variant="accent" onClick={() => setConvertOpen(true)}>
              <GraduationCap className="h-4 w-4" />
              Convert to Student
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Phone
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.personal.phone}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Email
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.personal.email || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Source
                  </div>
                  <LeadSourceBadge source={lead.source} />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Branch
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.branch.name}
                  </div>
                </div>

                {lead.interestedProgram && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Interested Program
                    </div>
                    <div className="text-foreground">
                      {lead.interestedProgram.name}
                    </div>
                  </div>
                )}

                {lead.interestedVisaCategory && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Interested Visa
                    </div>
                    <div className="text-foreground">
                      {lead.interestedVisaCategory.name}
                    </div>
                  </div>
                )}

                {lead.sourceMetadata?.referredBy && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Referred By
                    </div>
                    <div className="text-foreground">
                      {lead.sourceMetadata.referredBy}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Counselor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Assigned Counselor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.assignedCounselor ? (
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    {lead.assignedCounselor.firstName}{' '}
                    {lead.assignedCounselor.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lead.assignedCounselor.email}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No counselor assigned yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Converted */}
          {lead.convertedToStudent && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-success">
                  <GraduationCap className="h-4 w-4" />
                  Converted to Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() =>
                    router.push(`/students/${lead.convertedToStudent!.id}`)
                  }
                  className="text-sm text-accent hover:underline font-medium"
                >
                  {lead.convertedToStudent.studentId} —{' '}
                  {lead.convertedToStudent.firstName}{' '}
                  {lead.convertedToStudent.lastName}
                </button>
                {lead.convertedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Converted on {format(new Date(lead.convertedAt), 'PPP')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="space-y-6">
          <LeadTimeline lead={lead} />

          {/* Created By */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium text-foreground">
                  {lead.createdBy.firstName} {lead.createdBy.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lead.createdBy.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(lead.createdAt), 'PPP p')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AssignCounselorDialog
        lead={lead}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />

      <LeadStatusTransitionDialog
        lead={lead}
        open={transitionOpen}
        onOpenChange={setTransitionOpen}
      />

      <ScheduleCounselingDialog
        leadId={lead.id}
        branchId={lead.branch.id}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />

      <CreateStudentDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        fromLead={lead}
      />
    </div>
  );
}