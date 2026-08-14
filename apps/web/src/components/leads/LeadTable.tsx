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
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadSourceBadge } from './LeadSourceBadge';
import type { Lead } from '@/lib/api/leads';
import { UserPlus } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  isLoading?: boolean;
}

export function LeadTable({ leads, isLoading }: LeadTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Counselor</TableHead>
              <TableHead>Created</TableHead>
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

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={UserPlus}
          title="No leads found"
          description="No leads match your current filters. Try adjusting them or create a new lead."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[130px]">Lead #</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Counselor</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => router.push(`/leads/${lead.id}`)}
            >
              <TableCell className="font-mono text-xs">
                {lead.leadNumber}
              </TableCell>
              <TableCell className="font-medium">
                {lead.personal.firstName} {lead.personal.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.personal.phone}
              </TableCell>
              <TableCell>
                <LeadSourceBadge source={lead.source} />
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.assignedCounselor
                  ? `${lead.assignedCounselor.firstName} ${lead.assignedCounselor.lastName}`
                  : '—'}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistance(new Date(lead.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}