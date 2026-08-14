import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/lib/api/applications';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted' | 'outline';
  }
> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  REGISTERED: { label: 'Registered', variant: 'secondary' },
  DOCUMENT_COLLECTION: { label: 'Document Collection', variant: 'warning' },
  DOCUMENT_REVIEW: { label: 'Document Review', variant: 'warning' },
  DOCUMENT_VERIFICATION: { label: 'Document Verification', variant: 'warning' },
  FINAL_APPROVAL: { label: 'Final Approval', variant: 'accent' },
  SUBMITTED: { label: 'Submitted', variant: 'accent' },
  PROCESSING: { label: 'Processing', variant: 'accent' },
  ADDITIONAL_DOCUMENT_REQUIRED: { label: 'Additional Docs Required', variant: 'destructive' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'muted' },
};

export function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  const c = CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={c.variant} className={cn(className)}>
      {c.label}
    </Badge>
  );
}

// State machine — matches backend
export const ALLOWED_APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  DRAFT: ['REGISTERED', 'CANCELLED'],
  REGISTERED: ['DOCUMENT_COLLECTION', 'CANCELLED'],
  DOCUMENT_COLLECTION: ['DOCUMENT_REVIEW', 'CANCELLED'],
  DOCUMENT_REVIEW: ['DOCUMENT_VERIFICATION', 'DOCUMENT_COLLECTION', 'CANCELLED'],
  DOCUMENT_VERIFICATION: ['FINAL_APPROVAL', 'DOCUMENT_REVIEW', 'CANCELLED'],
  FINAL_APPROVAL: ['SUBMITTED', 'DOCUMENT_VERIFICATION', 'CANCELLED'],
  SUBMITTED: ['PROCESSING', 'ADDITIONAL_DOCUMENT_REQUIRED', 'CANCELLED'],
  PROCESSING: ['APPROVED', 'REJECTED', 'ADDITIONAL_DOCUMENT_REQUIRED'],
  ADDITIONAL_DOCUMENT_REQUIRED: ['DOCUMENT_REVIEW'],
  APPROVED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft',
  REGISTERED: 'Registered',
  DOCUMENT_COLLECTION: 'Document Collection',
  DOCUMENT_REVIEW: 'Document Review',
  DOCUMENT_VERIFICATION: 'Document Verification',
  FINAL_APPROVAL: 'Final Approval',
  SUBMITTED: 'Submitted',
  PROCESSING: 'Processing',
  ADDITIONAL_DOCUMENT_REQUIRED: 'Additional Docs Required',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};