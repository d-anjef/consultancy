import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function LoadingState({
  message,
  className,
  size = 'md',
  fullPage = false,
}: LoadingStateProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullPage ? 'min-h-[400px]' : 'py-12',
        className,
      )}
    >
      <Loader2 className={cn('animate-spin text-accent', iconSize)} />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

export function PageLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingState message="Loading…" size="lg" />
    </div>
  );
}