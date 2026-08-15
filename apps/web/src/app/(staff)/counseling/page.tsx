'use client';

import { useState } from 'react';
import { Plus, CalendarClock } from 'lucide-react';
import { useCounselings } from '@/hooks/useCounseling';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { CounselingTable } from '@/components/counseling/CounselingTable';
import { ScheduleCounselingDialog } from '@/components/counseling/ScheduleCounselingDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';

export default function CounselingPage() {
  const { has } = usePermissions();
  const [page, setPage] = useState(1);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data, isLoading } = useCounselings({ page, limit: 20 });
  const sessions = data?.items ?? [];

  const canCreate = has(PERMISSION_CODES.CREATE_COUNSELING);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Counseling
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled counseling sessions across your branch
          </p>
        </div>
        {canCreate && (
          <Button variant="accent" onClick={() => setScheduleOpen(true)}>
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Sessions
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {sessions.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Booked
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {sessions.filter((s) => s.status === 'BOOKED').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Attended
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {sessions.filter((s) => s.status === 'ATTENDED').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            No Show
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {sessions.filter((s) => s.status === 'NO_SHOW').length}
          </p>
        </Card>
      </div>

      {/* Table or Empty State */}
      {!isLoading && sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="No counseling sessions"
            description="Schedule a counseling session with any lead to get started."
            action={
              canCreate ? (
                <Button variant="accent" onClick={() => setScheduleOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Schedule First Session
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <CounselingTable sessions={sessions} isLoading={isLoading} />
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Schedule Dialog */}
      <ScheduleCounselingDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />
    </div>
  );
}