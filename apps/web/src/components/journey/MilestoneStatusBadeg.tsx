import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MilestoneStatus } from '@/lib/api/journey';

interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  className?: string;
}

const CONFIG: Record<
  MilestoneStatus,
  { label: string; variant: 'muted' | 'accent' | 'success' | 'secondary' }
> = {
  NOT_STARTED: { label: 'Not Started', variant: 'muted' },
  IN_PROGRESS: { label: 'In Progress', variant: 'accent' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  SKIPPED: { label: 'Skipped', variant: 'secondary' },
};

export function MilestoneStatusBadge({
  status,
  className,
}: MilestoneStatusBadgeProps) {
  const c = CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={c.variant} className={cn(className)}>
      {c.label}
    </Badge>
  );
}