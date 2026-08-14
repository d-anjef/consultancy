import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentStatus } from '@/lib/api/documents';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const CONFIG: Record<
  DocumentStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';
  }
> = {
  NOT_SUBMITTED: { label: 'Not Submitted', variant: 'muted' },
  SUBMITTED: { label: 'Submitted', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
  VERIFIED: { label: 'Verified', variant: 'accent' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  RESUBMISSION_REQUIRED: { label: 'Resubmission Required', variant: 'destructive' },
  APPROVED: { label: 'Approved', variant: 'success' },
};

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const c = CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={c.variant} className={cn(className)}>
      {c.label}
    </Badge>
  );
}

// State machine matching backend
export const ALLOWED_DOCUMENT_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  NOT_SUBMITTED: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED'],
  VERIFIED: ['APPROVED', 'REJECTED'],
  REJECTED: ['RESUBMISSION_REQUIRED'],
  RESUBMISSION_REQUIRED: ['SUBMITTED'],
  APPROVED: [],
};