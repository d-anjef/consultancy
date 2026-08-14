import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StudentStatus } from '@/lib/api/students';

interface StudentStatusBadgeProps {
  status: StudentStatus;
  className?: string;
}

const CONFIG: Record<
  StudentStatus,
  { label: string; variant: 'success' | 'muted' | 'destructive' | 'warning' | 'default' }
> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  SUSPENDED: { label: 'Suspended', variant: 'warning' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'destructive' },
  ARCHIVED: { label: 'Archived', variant: 'muted' },
};

export function StudentStatusBadge({ status, className }: StudentStatusBadgeProps) {
  const c = CONFIG[status] ?? { label: status, variant: 'muted' as const };
  return (
    <Badge variant={c.variant} className={cn(className)}>
      {c.label}
    </Badge>
  );
}