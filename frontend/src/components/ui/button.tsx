import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
      primary: 'border-primary bg-primary text-primary-foreground hover:border-primary/90 hover:bg-primary/90',
      secondary: 'border-border bg-secondary text-secondary-foreground hover:border-primary',
      outline: 'border-input bg-surface text-foreground hover:border-primary hover:text-primary',
      ghost: 'border-transparent bg-transparent text-foreground hover:border-border hover:bg-muted',
      destructive: 'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90',
      link: 'h-auto border-transparent p-0 font-normal text-primary underline-offset-4 hover:underline',
    };
    const sizes = {
      sm: 'min-h-11 gap-1.5 px-3 text-xs',
      md: 'min-h-11 gap-2 px-4 py-2 text-sm',
      lg: 'min-h-12 gap-2.5 px-6 text-base',
      icon: 'h-11 w-11 p-0',
    };

    return <button ref={ref} disabled={disabled || isLoading} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>;
  },
);
Button.displayName = 'Button';

export { Button };