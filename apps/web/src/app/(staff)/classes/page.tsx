'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, BookOpen, Users as UsersIcon, Calendar } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CreateClassDialog } from '@/components/classes/CreateClassDialog';
import type { ClassEntity } from '@/lib/api/classes';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_VARIANTS: Record<string, 'success' | 'muted' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  COMPLETED: 'muted',
  CANCELLED: 'destructive',
  PAUSED: 'warning',
};

export default function ClassesPage() {
  const router = useRouter();
  const { has } = usePermissions();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useClasses({ page, limit: 20 });
  const canCreate = has(PERMISSION_CODES.CREATE_CLASS);

  const classes = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage classes, schedules, and enrollment
          </p>
        </div>
        {canCreate && (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Class
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading classes…" />
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No classes yet"
            description="Create your first class to start enrolling students."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onClick={() => router.push(`/classes/${cls.id}`)}
            />
          ))}
        </div>
      )}

      <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function ClassCard({
  cls,
  onClick,
}: {
  cls: ClassEntity;
  onClick: () => void;
}) {
  const scheduleDays = cls.schedule.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ');

  return (
    <Card
      className="cursor-pointer hover:border-muted-foreground/20 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight truncate">
              {cls.name}
            </CardTitle>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {cls.classCode}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[cls.status] ?? 'muted'}>
            {cls.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cls.languageLevel && (
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="text-xxs">
              {cls.languageLevel.name}
            </Badge>
            {cls.program && (
              <Badge variant="outline" className="text-xxs">
                {cls.program.name}
              </Badge>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Teacher:</span>{' '}
          {cls.teacher.firstName} {cls.teacher.lastName}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{scheduleDays}</span>
          <span>·</span>
          <span className="font-mono">
            {cls.schedule.startTime} — {cls.schedule.endTime}
          </span>
        </div>

        {cls.schedule.roomOrLocation && (
          <div className="text-xs text-muted-foreground">
            Room: {cls.schedule.roomOrLocation}
          </div>
        )}

        <div className="flex items-center gap-1 text-xs pt-2 border-t border-border">
          <UsersIcon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium tabular-nums text-foreground">
            {cls.studentsCount}
          </span>
          <span className="text-muted-foreground">
            student{cls.studentsCount !== 1 ? 's' : ''} enrolled
          </span>
        </div>

        <div className="text-xxs text-muted-foreground">
          Started {format(new Date(cls.startDate), 'MMM dd, yyyy')}
          {cls.endDate && (
            <span> · Ends {format(new Date(cls.endDate), 'MMM dd, yyyy')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}