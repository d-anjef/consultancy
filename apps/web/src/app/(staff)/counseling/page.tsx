'use client';

import { useState } from 'react';
import { useCounselings } from '@/hooks/useCounseling';
import { CounselingTable } from '@/components/counseling/CounselingTable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CounselingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCounselings({ page, limit: 20 });

  const sessions = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Counseling
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scheduled counseling sessions across your branch
        </p>
      </div>

      {data && (
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
      )}

      <CounselingTable sessions={sessions} isLoading={isLoading} />

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
    </div>
  );
}