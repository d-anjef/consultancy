'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { CounselingStatusBadge } from './CounselingStatusBadge';
import type { Counseling } from '@/lib/api/counseling';
import { CalendarClock } from 'lucide-react';

interface CounselingTableProps {
  sessions: Counseling[];
  isLoading?: boolean;
}

export function CounselingTable({ sessions, isLoading }: CounselingTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session #</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Counselor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={CalendarClock}
          title="No counseling sessions"
          description="No sessions scheduled yet. Schedule one from a lead's page."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[130px]">Session #</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Counselor</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow
              key={session.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => router.push(`/counseling/${session.id}`)}
            >
              <TableCell className="font-mono text-xs">
                {session.counselingNumber}
              </TableCell>
              <TableCell className="font-medium">
                {session.lead.firstName} {session.lead.lastName}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {session.counselor.firstName} {session.counselor.lastName}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(session.scheduledDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="text-sm font-mono">
                {session.scheduledTime}
              </TableCell>
              <TableCell>
                <CounselingStatusBadge status={session.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}