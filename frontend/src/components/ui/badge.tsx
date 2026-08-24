import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'signal-false' | 'signal-true';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'border-border text-foreground',
    destructive: 'border-transparent bg-destructive text-destructive-foreground',
    'signal-false': 'border-signal-false-border bg-signal-false-light text-signal-false-ink',
    'signal-true': 'border-signal-true-border bg-signal-true-light text-signal-true-ink',
  };
  return <div className={cn('inline-flex items-center border px-2.5 py-1 text-xs font-semibold', variants[variant], className)} {...props} />;
}

export { Badge };