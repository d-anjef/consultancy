'use client';

import { useRouter } from 'next/navigation';
import { formatDistance } from 'date-fns';
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
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import type { Application } from '@/lib/api/applications';
import { FileText } from 'lucide-react';

interface ApplicationTableProps {
  applications: Application[];
  isLoading?: boolean;
}

export function ApplicationTable({ applications, isLoading }: ApplicationTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Visa</TableHead>
              <TableHead>Intake</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
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

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={FileText}
          title="No applications"
          description="No applications match your filters. Create one from a student's page."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">App #</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Visa</TableHead>
            <TableHead>Intake</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((a) => (
            <TableRow
              key={a.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => router.push(`/applications/${a.id}`)}
            >
              <TableCell className="font-mono text-xs">{a.applicationNumber}</TableCell>
              <TableCell>
                <div className="font-medium">
                  {a.student.firstName} {a.student.lastName}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {a.student.studentId}
                </div>
              </TableCell>
              <TableCell className="text-sm">{a.program.name}</TableCell>
              <TableCell className="text-sm">{a.visaCategory.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {a.intake.year}
                {a.intake.session ? ` — ${a.intake.session}` : ''}
              </TableCell>
              <TableCell>
                <ApplicationStatusBadge status={a.status} />
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistance(new Date(a.createdAt), new Date(), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}