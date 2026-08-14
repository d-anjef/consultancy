import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xxs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-primary text-primary-foreground',
        secondary: 'border border-border bg-secondary text-secondary-foreground',
        accent: 'border border-transparent bg-accent text-accent-foreground',
        outline: 'border border-border text-foreground',
        success:
          'border border-success/20 bg-success/10 text-success',
        warning:
          'border border-accent/30 bg-accent-light text-accent-foreground',
        destructive:
          'border border-destructive/20 bg-destructive/10 text-destructive',
        muted:
          'border border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };