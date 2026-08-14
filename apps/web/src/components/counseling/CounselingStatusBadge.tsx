import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CounselingStatus, CounselingResult } from '@/lib/api/counseling';

interface CounselingStatusBadgeProps {
  status: CounselingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  CounselingStatus,
  { label: string; variant: 'default' | 'secondary' | 'accent' | 'outline' | 'success' | 'warning' | 'destructive' | 'muted' }
> = {
  BOOKED: { label: 'Booked', variant: 'warning' },
  ATTENDED: { label: 'Attended', variant: 'success' },
  NO_SHOW: { label: 'No Show', variant: 'destructive' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'accent' },
  CANCELLED: { label: 'Cancelled', variant: 'muted' },
};

export function CounselingStatusBadge({
  status,
  className,
}: CounselingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}

interface CounselingOutcomeBadgeProps {
  result: CounselingResult;
  className?: string;
}

const OUTCOME_CONFIG: Record<
  CounselingResult,
  { label: string; variant: 'success' | 'destructive' | 'warning' }
> = {
  QUALIFIED: { label: 'Qualified', variant: 'success' },
  NOT_QUALIFIED: { label: 'Not Qualified', variant: 'destructive' },
  NEEDS_FOLLOWUP: { label: 'Needs Follow-up', variant: 'warning' },
};

export function CounselingOutcomeBadge({
  result,
  className,
}: CounselingOutcomeBadgeProps) {
  const config = OUTCOME_CONFIG[result] ?? { label: result, variant: 'warning' as const };
  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}