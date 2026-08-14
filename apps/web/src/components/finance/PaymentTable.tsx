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
import { PaymentStatusBadge } from './InvoiceStatusBadge';
import { formatNPR } from '@/lib/utils/currency';
import type { Payment } from '@/lib/api/finance';
import { Receipt } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

export function PaymentTable({ payments, isLoading }: PaymentTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
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

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={Receipt}
          title="No payments"
          description="No payments recorded yet."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Receipt #</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow
              key={p.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => router.push(`/finance/payments/${p.id}`)}
            >
              <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
              <TableCell>
                <div className="font-medium">
                  {p.student.firstName} {p.student.lastName}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {p.student.studentId}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {p.invoice.invoiceNumber}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatNPR(p.amount)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {p.method.replace(/_/g, ' ')}
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(p.paidAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={p.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}