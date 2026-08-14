'use client';

import { format } from 'date-fns';
import { BookOpen, Calendar, User } from 'lucide-react';
import { useMyClasses } from '@/hooks/useClasses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MyClassesPage() {
  const { data: classes = [], isLoading } = useMyClasses();

  if (isLoading) return <LoadingState fullPage message="Loading your classes…" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          My Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          My Classes
        </h1>
      </div>

      {classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No classes"
            description="You're not enrolled in any classes yet."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const scheduleDays = cls.schedule.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ');
            return (
              <Card key={cls.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {cls.name}
                    </CardTitle>
                    <Badge
                      variant={cls.status === 'ACTIVE' ? 'success' : 'muted'}
                    >
                      {cls.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    {cls.classCode}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cls.languageLevel && (
                    <Badge variant="accent" className="text-xs">
                      {cls.languageLevel.name}
                    </Badge>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {cls.teacher.firstName} {cls.teacher.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{scheduleDays}</span>
                    </div>
                  </div>

                  <div className="text-sm font-mono text-foreground">
                    {cls.schedule.startTime} — {cls.schedule.endTime}
                    {cls.schedule.roomOrLocation && (
                      <span className="text-muted-foreground">
                        {' '}· Room {cls.schedule.roomOrLocation}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Started {format(new Date(cls.startDate), 'PPP')}
                    {cls.endDate && (
                      <span> · Ends {format(new Date(cls.endDate), 'PPP')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}