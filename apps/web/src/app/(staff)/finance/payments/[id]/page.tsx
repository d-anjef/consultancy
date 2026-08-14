'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Receipt, XCircle, Building2, User, FileText } from 'lucide-react';
import { usePayment } from '@/hooks/useFinance';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSION_CODES } from '@consultancy/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { PaymentStatusBadge } from '@/components/finance/InvoiceStatusBadge';
import { VoidPaymentDialog } from '@/components/finance/VoidPaymentDialog';
import { formatNPR } from '@/lib/utils/currency';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { has } = usePermissions();

  const [voidOpen, setVoidOpen] = useState(false);

  const { data: payment, isLoading } = usePayment(id);

  const canVoid = has(PERMISSION_CODES.VOID_PAYMENT);

  if (isLoading) return <LoadingState fullPage message="Loading payment…" />;

  if (!payment) {
    return (
      <EmptyState
        icon={Receipt}
        title="Payment not found"
        description="This payment doesn't exist or you don't have permission to view it."
        action={
          <Button variant="outline" onClick={() => router.push('/finance')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
    );
  }

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
              Receipt {payment.receiptNumber}
            </h1>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {payment.paymentNumber}
          </p>
        </div>

        {canVoid && payment.status === 'COMPLETED' && (
          <Button
            variant="outline"
            onClick={() => setVoidOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Void Payment
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-secondary/30 p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Amount
              </p>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {formatNPR(payment.amount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Method
                </div>
                <div className="text-foreground">{payment.method.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Paid At
                </div>
                <div className="text-foreground">
                  {format(new Date(payment.paidAt), 'PPP p')}
                </div>
              </div>
              {payment.methodDetails?.bankName && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Bank
                  </div>
                  <div className="text-foreground">{payment.methodDetails.bankName}</div>
                </div>
              )}
              {payment.methodDetails?.chequeNumber && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Cheque #
                  </div>
                  <div className="text-foreground font-mono">
                    {payment.methodDetails.chequeNumber}
                  </div>
                </div>
              )}
              {payment.methodDetails?.transactionId && (
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Transaction ID
                  </div>
                  <div className="text-foreground font-mono">
                    {payment.methodDetails.transactionId}
                  </div>
                </div>
              )}
            </div>

            {payment.notes && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Notes
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {payment.notes}
                </p>
              </div>
            )}

            {payment.status === 'VOIDED' && payment.voidReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <div className="text-xs uppercase tracking-wider text-destructive mb-1">
                  Void Reason
                </div>
                <p className="text-sm text-foreground">{payment.voidReason}</p>
                {payment.voidedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Voided on {format(new Date(payment.voidedAt), 'PPP p')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
                onClick={() => router.push(`/students/${payment.student.id}`)}
                className="text-accent hover:underline font-medium"
              >
                {payment.student.studentId}
              </button>
              <div className="text-foreground mt-0.5">
                {payment.student.firstName} {payment.student.lastName}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <button
                onClick={() => router.push(`/finance/invoices/${payment.invoice.id}`)}
                className="text-accent hover:underline font-mono"
              >
                {payment.invoice.invoiceNumber}
              </button>
              <div className="text-xs text-muted-foreground">
                Total: {formatNPR(payment.invoice.totalAmount)}
              </div>
              <div className="text-xs text-muted-foreground">
                Balance: {formatNPR(payment.invoice.balanceAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{payment.branch.name}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recorded By</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium text-foreground">
                {payment.recordedBy.firstName} {payment.recordedBy.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {payment.recordedBy.email}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(payment.createdAt), 'PPP p')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <VoidPaymentDialog
        payment={payment}
        open={voidOpen}
        onOpenChange={setVoidOpen}
      />
    </div>
  );
}