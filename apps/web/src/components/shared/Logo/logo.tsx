import { cn } from '@/lib/utils/cn';
import { siteConfig } from '@/config/site';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, variant = 'full', size = 'md' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold no-select',
          size === 'sm' && 'h-7 w-7 text-xs',
          size === 'md' && 'h-8 w-8 text-sm',
          size === 'lg' && 'h-10 w-10 text-base',
          className,
        )}
      >
        C
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 no-select', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold',
          size === 'sm' && 'h-6 w-6 text-xxs',
          size === 'md' && 'h-7 w-7 text-xs',
          size === 'lg' && 'h-8 w-8 text-sm',
        )}
      >
        C
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            'font-bold text-foreground tracking-tight',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-lg',
          )}
        >
          {siteConfig.shortName}
        </span>
        <span
          className={cn(
            'text-muted-foreground font-medium',
            size === 'sm' && 'text-xxs',
            size === 'md' && 'text-xxs',
            size === 'lg' && 'text-xs',
          )}
        >
          Education Center
        </span>
      </div>
    </div>
  );
}