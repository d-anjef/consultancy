import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/lib/api/leads';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; variant: 'default' | 'secondary' | 'accent' | 'outline' | 'success' | 'warning' | 'destructive' | 'muted' }
> = {
  NEW: { label: 'New', variant: 'default' },
  CONTACTED: { label: 'Contacted', variant: 'secondary' },
  COUNSELING_BOOKED: { label: 'Counseling Booked', variant: 'warning' },
  COUNSELING_ATTENDED: { label: 'Counseling Attended', variant: 'accent' },
  NO_SHOW: { label: 'No Show', variant: 'destructive' },
  FOLLOW_UP: { label: 'Follow Up', variant: 'warning' },
  INTERESTED: { label: 'Interested', variant: 'accent' },
  QUALIFIED: { label: 'Qualified', variant: 'success' },
  CONVERTED: { label: 'Converted', variant: 'success' },
  NOT_INTERESTED: { label: 'Not Interested', variant: 'muted' },
  LOST: { label: 'Lost', variant: 'muted' },
};

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}