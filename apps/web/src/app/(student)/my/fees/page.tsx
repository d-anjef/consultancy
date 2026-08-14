'use client';

import { format } from 'date-fns';
import { Wallet, Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMyInvoices, useMyPayments } from '@/hooks/useFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/finance/InvoiceStatusBadge';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { formatNPR } from '@/lib/utils/currency';

export default function MyFeesPage() {
  const { data: invoices = [], isLoading: invoicesLoading } = useMyInvoices();
  const { data: payments = [], isLoading: paymentsLoading } = useMyPayments();

  if (invoicesLoading || paymentsLoading) {
    return <LoadingState fullPage message="Loading your fees…" />;
  }

  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueInvoices = invoices.filter(
    (inv) =>
      new Date(inv.dueDate) < new Date() &&
      inv.balanceAmount > 0 &&
      ['ISSUED', 'PARTIALLY_PAID'].includes(inv.status),
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          My Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Fees</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={totalDue > 0 ? 'border-accent/30' : ''}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
                <Wallet className="h-4 w-4 text-accent-foreground" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Outstanding
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatNPR(totalDue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Paid
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-success">
              {formatNPR(totalPaid)}
            </p>
          </CardContent>
        </Card>

        <Card className={overdueInvoices.length > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Overdue
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-destructive">
              {overdueInvoices.length}
            </p>
            {overdueInvoices.length > 0 && (
              <p className="text-xs text-destructive mt-1">
                Please pay overdue invoices
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Invoices ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No invoices"
              description="You have no invoices at this time."
            />
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => {
                const isOverdue =
                  new Date(inv.dueDate) < new Date() &&
                  inv.balanceAmount > 0 &&
                  ['ISSUED', 'PARTIALLY_PAID'].includes(inv.status);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {inv.invoiceNumber}
                        </span>
                        <InvoiceStatusBadge status={isOverdue ? 'OVERDUE' : inv.status} />
                      </div>
                      <p className="text-sm text-foreground">
                        {inv.lineItems.length} item{inv.lineItems.length > 1 ? 's' : ''} · Due{' '}
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {format(new Date(inv.dueDate), 'PPP')}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm text-muted-foreground">
                        Total {formatNPR(inv.totalAmount)}
                      </div>
                      <div className="font-bold tabular-nums text-foreground">
                        Due {formatNPR(inv.balanceAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Payment History ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments"
              description="No payment history yet."
            />
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.receiptNumber}
                      </span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                    <p className="text-sm text-foreground">
                      {p.method.replace(/_/g, ' ')} · {format(new Date(p.paidAt), 'PPP')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold tabular-nums text-foreground">
                      {formatNPR(p.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}