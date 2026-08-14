import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, trend, accent }: StatCardProps) {
  return (
    <Card className="p-5 hover:border-muted-foreground/20 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-bold tabular-nums text-foreground',
              accent && 'text-accent-foreground',
            )}
          >
            {value}
          </p>
          {trend && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  'font-medium',
                  trend.value > 0 ? 'text-success' : trend.value < 0 ? 'text-destructive' : '',
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>{' '}
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </Card>
  );
}