'use client';

import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  User,
  Users as UsersIcon,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useClass } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cls, isLoading } = useClass(id);

  if (isLoading) return <LoadingState fullPage message="Loading class…" />;

  if (!cls) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Class not found"
        action={
          <Button variant="outline" onClick={() => router.push('/classes')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/classes')}
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Classes
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {cls.name}
          </h1>
          <Badge variant={cls.status === 'ACTIVE' ? 'success' : 'muted'}>
            {cls.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground font-mono">{cls.classCode}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Days
                </div>
                <div className="flex gap-1">
                  {cls.schedule.daysOfWeek.map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">
                      {DAY_LABELS[d]}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Time
                  </div>
                  <div className="font-mono text-foreground">
                    {cls.schedule.startTime} — {cls.schedule.endTime}
                  </div>
                </div>
                {cls.schedule.roomOrLocation && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Room / Location
                    </div>
                    <div className="text-foreground">{cls.schedule.roomOrLocation}</div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Start Date
                  </div>
                  <div className="text-foreground">
                    {format(new Date(cls.startDate), 'PPP')}
                  </div>
                </div>
                {cls.endDate && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      End Date
                    </div>
                    <div className="text-foreground">
                      {format(new Date(cls.endDate), 'PPP')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Enrolled Students ({cls.studentsCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cls.students.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No students enrolled yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {cls.students.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-secondary/50"
                      onClick={() => router.push(`/students/${s.id}`)}
                    >
                      <div>
                        <div className="font-medium text-sm text-foreground">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {s.studentId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {cls.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">{cls.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium text-foreground">
                {cls.teacher.firstName} {cls.teacher.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{cls.teacher.email}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">
                {cls.teacher.employeeId}
              </div>
            </CardContent>
          </Card>

          {cls.languageLevel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Language Level
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <Badge variant="accent">{cls.languageLevel.name}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {cls.languageLevel.examType}
                </p>
              </CardContent>
            </Card>
          )}

          {cls.program && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Program</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium text-foreground">{cls.program.name}</div>
                <div className="text-xs text-muted-foreground">{cls.program.type}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{cls.branch.name}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}