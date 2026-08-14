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
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatNPR } from '@/lib/utils/currency';
import type { Invoice } from '@/lib/api/finance';
import { Wallet } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function InvoiceTable({ invoices, isLoading }: InvoiceTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
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

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={Wallet}
          title="No invoices"
          description="No invoices match your filters. Create one from a student's page."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Invoice #</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => {
            const isOverdue =
              new Date(inv.dueDate) < new Date() &&
              inv.balanceAmount > 0 &&
              ['ISSUED', 'PARTIALLY_PAID'].includes(inv.status);

            return (
              <TableRow
                key={inv.id}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => router.push(`/finance/invoices/${inv.id}`)}
              >
                <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {inv.student.firstName} {inv.student.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {inv.student.studentId}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNPR(inv.totalAmount)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-success">
                  {formatNPR(inv.paidAmount)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  <span className={inv.balanceAmount > 0 ? 'text-destructive' : ''}>
                    {formatNPR(inv.balanceAmount)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                    {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={isOverdue ? 'OVERDUE' : inv.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}