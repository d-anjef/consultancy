import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InvoiceStatus, PaymentStatus } from '@/lib/api/finance';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const INVOICE_CONFIG: Record<
  InvoiceStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted' | 'outline';
  }
> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  ISSUED: { label: 'Issued', variant: 'secondary' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'muted' },
  VOIDED: { label: 'Voided', variant: 'muted' },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const c = INVOICE_CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={c.variant} className={cn(className)}>
      {c.label}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: 'success' | 'destructive' | 'muted' }
> = {
  COMPLETED: { label: 'Completed', variant: 'success' },
  VOIDED: { label: 'Voided', variant: 'muted' },
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const c = PAYMENT_CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={c.variant} className={cn(className)}>
      {c.label}
    </Badge>
  );
}