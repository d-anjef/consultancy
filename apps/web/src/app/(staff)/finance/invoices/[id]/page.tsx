'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Receipt,
  Wallet,
  XCircle,
  Building2,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { useInvoice, usePayments, useCancelInvoice } from '@/hooks/useFinance';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/finance/InvoiceStatusBadge';
import { RecordPaymentDialog } from '@/components/finance/RecordPaymentDialog';
import { formatNPR } from '@/lib/utils/currency';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: invoice, isLoading } = useInvoice(id);
  const { data: paymentsData } = usePayments({ invoiceId: id, limit: 50 });

  const cancel = useCancelInvoice(id);

  const canCreatePayment = has(PERMISSION_CODES.CREATE_PAYMENT);
  const canEditInvoice = has(PERMISSION_CODES.EDIT_INVOICE);

  if (isLoading) return <LoadingState fullPage message="Loading invoice…" />;

  if (!invoice) {
    return (
      <EmptyState
        icon={Wallet}
        title="Invoice not found"
        description="This invoice doesn't exist or you don't have permission to view it."
        action={
          <Button variant="outline" onClick={() => router.push('/finance')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

  const payments = paymentsData?.items ?? [];
  const canRecordPayment =
    canCreatePayment &&
    invoice.balanceAmount > 0 &&
    !['CANCELLED', 'VOIDED'].includes(invoice.status);
  const canCancel =
    canEditInvoice && invoice.paidAmount === 0 && invoice.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => router.push('/finance')}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Finance
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.student.firstName} {invoice.student.lastName} ·{' '}
            {invoice.student.studentId}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {canRecordPayment && (
            <Button variant="accent" onClick={() => setPaymentOpen(true)}>
              <Receipt className="h-4 w-4" />
              Record Payment
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => cancel.mutate()}
              isLoading={cancel.isPending}
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4" />
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.lineItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatNPR(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums text-foreground shrink-0">
                      {formatNPR(item.total)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatNPR(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatNPR(invoice.discount)}</span>
                  </div>
                )}
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatNPR(invoice.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span className="tabular-nums">{formatNPR(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Paid</span>
                  <span className="tabular-nums">{formatNPR(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-destructive font-bold">
                  <span>Outstanding</span>
                  <span className="tabular-nums">{formatNPR(invoice.balanceAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Payment History ({payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {p.receiptNumber}
                          </span>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {p.method.replace(/_/g, ' ')} · {format(new Date(p.paidAt), 'PPP')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium tabular-nums text-foreground">
                          {formatNPR(p.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.recordedBy.firstName} {p.recordedBy.lastName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Student
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <button
                onClick={() => router.push(`/students/${invoice.student.id}`)}
                className="text-accent hover:underline font-medium"
              >
                {invoice.student.studentId}
              </button>
              <div className="text-foreground mt-0.5">
                {invoice.student.firstName} {invoice.student.lastName}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Issued
                </div>
                <div>{format(new Date(invoice.issueDate), 'PPP')}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Due
                </div>
                <div>{format(new Date(invoice.dueDate), 'PPP')}</div>
              </div>
              {invoice.paidDate && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Paid
                  </div>
                  <div className="text-success">
                    {format(new Date(invoice.paidDate), 'PPP')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.application && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => router.push(`/applications/${invoice.application!.id}`)}
                  className="text-sm text-accent hover:underline font-mono"
                >
                  {invoice.application.applicationNumber}
                </button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{invoice.branch.name}</CardContent>
          </Card>
        </div>
      </div>

      <RecordPaymentDialog
        invoice={invoice}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </div>
  );
}