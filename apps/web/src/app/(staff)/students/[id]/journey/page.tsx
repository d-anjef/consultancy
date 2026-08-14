'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';
import { useStudent } from '@/hooks/useStudents';
import { useStudentJourney } from '@/hooks/useJourney';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { JourneyTimeline } from '@/components/journey/JourneyTimeline';
import { StartJourneyDialog } from '@/components/journey/StartJourneyDialog';

export default function StudentJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { has } = usePermissions();

  const [startOpen, setStartOpen] = useState(false);

  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const { data: journey, isLoading: journeyLoading } = useStudentJourney(studentId);

  const canEdit = has(PERMISSION_CODES.EDIT_STUDENT);

  if (studentLoading || journeyLoading) {
    return <LoadingState fullPage message="Loading journey…" />;
  }

  if (!student) {
    return (
      <EmptyState
        icon={MapPin}
        title="Student not found"
        action={
          <Button variant="outline" onClick={() => router.push('/students')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/students/${studentId}`)}
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Student
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Journey Tracker
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {student.personal.firstName} {student.personal.lastName} ·{' '}
          {student.studentId}
        </p>
      </div>

      {!journey ? (
        <Card>
          <EmptyState
            icon={MapPin}
            title="No journey started yet"
            description="Start a journey to track this student's progress through milestones."
            action={
              canEdit ? (
                <Button variant="accent" onClick={() => setStartOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Start Journey
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* Journey Info Card */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Visa Pathway
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {journey.visaCategory.name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total Milestones
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5 tabular-nums">
                  {journey.milestones.length}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current Step
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5 truncate max-w-[200px]">
                  {journey.currentMilestone?.title ?? 'All complete!'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <JourneyTimeline journey={journey} editable={canEdit} />
        </>
      )}

      <StartJourneyDialog
        student={student}
        open={startOpen}
        onOpenChange={setStartOpen}
      />
    </div>
  );
}